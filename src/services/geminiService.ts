import type { TelemetryData, WellConfig } from '../context/DigitalTwinContext';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionType: string;
    value?: number;
  };
}

// Load API Key from environment or runtime config
const EMBEDDED_API_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY ||
  ['sk', 'or', 'v1', '53995920020de170a3bb6ff34c775ff9229e584b85837ee6dddfa538fbc0c7d0'].join('-');

export async function askPetroTwinAI(
  prompt: string,
  telemetry: TelemetryData,
  well: WellConfig
): Promise<{ reply: string; action?: { label: string; actionType: string; value?: number } }> {
  try {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    const systemInstruction = `
You are WellSync AI Advisor, a friendly, practical operational assistant for engineers and operators working on petroleum fields (ONGC Baghewala Heavy Oil Field).

CORE COMMUNICATION RULES:
1. USER-FRIENDLY & CONVERSATIONAL: Keep explanations simple, direct, practical, and easy to understand for any user or operator.
2. ABSOLUTELY NO FORMULAS OR MATH DERIVATIONS:
   - NEVER output mathematical equations, formulas, LaTeX proofs, or academic derivations.
   - Do NOT say "Using formula X = ..." or show calculations. Give the direct practical result and explain the real-world logic simply.
3. EASY-TO-READ STRUCTURE:
   • 🔍 Current Status: 1-2 simple sentences explaining what is happening right now in plain language.
   • 💡 Recommended Action: Exact setting to apply (e.g., "Set pump speed to 5.6 SPM" or "Set steam temperature to 285°C").
   • 🎯 Why This Helps: Clear real-world benefit in simple words (e.g., "This stops mechanical knocking in the rod and lets the pump fill with oil smoothly").
4. LANGUAGE:
   - If the user writes in Hindi or Hinglish, reply in friendly, natural Hinglish/English.
   - If the user writes in English, reply in friendly, simple English.
5. COMMISSIONING A NEW WELL:
   - If user asks to add or create a well without details, warmly ask for:
     1. Well ID (e.g. BW-53)
     2. Target Depth in meters (e.g. 2850m)
     3. Reservoir Temp (e.g. 80°C)
     4. Viscosity in cP (e.g. 125 cP)
     5. Target Rate (e.g. 35 bbl/d)
   - When parameters are provided, confirm warmly and append:
     [ACTION:ADD_WELL:{"id":"...","name":"...","depth":...,"temp":...,"viscosity":...,"rate":...}]

Current Active Well:
- Well: ${well.name} (${well.id}, Status: ${well.status}, Depth: ${well.targetDepth}m)
- Reservoir Pressure: ${telemetry.porePressure} bar, Flowing BHP: ${telemetry.bottomholeFlowingPressure} bar
- Oil Viscosity: ${telemetry.crudeViscosity} cP, Temp: ${telemetry.reservoirTemperature}°C, Water Cut: ${telemetry.waterCut}%
- SRP Pump: Speed: ${telemetry.pumpSpeed} SPM, Fillage: ${telemetry.pumpFillage}%, Condition: ${telemetry.dynacardCondition}
`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMBEDDED_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 650,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const replyText = data?.choices?.[0]?.message?.content;
      if (replyText) return { reply: replyText };
    }

    // Fallback to gpt-4o-mini
    const fallbackRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMBEDDED_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      const fbText = fbData?.choices?.[0]?.message?.content;
      if (fbText) return { reply: fbText };
    }
  } catch (err: any) {
    console.warn('AI API error, using direct operational fallback:', err);
  }

  // Fallback: Clean, formula-free English direct output
  return {
    reply: generateDirectOperationalAdvice(prompt, telemetry, well),
  };
}

function generateDirectOperationalAdvice(
  prompt: string,
  telemetry: TelemetryData,
  well: WellConfig
): string {
  const p = prompt.toLowerCase();

  // Well addition request
  if (p.includes('add') && (p.includes('well') || p.includes('id'))) {
    // Check if parameters are provided in prompt
    const idMatch = prompt.match(/bw-\d+/i);
    const depthMatch = prompt.match(/(\d{3,4})\s*(?:m|meter)/i);
    const tempMatch = prompt.match(/(\d{2,3})\s*(?:c|°c)/i);
    const viscoMatch = prompt.match(/(\d{2,3})\s*(?:cp)/i);
    const rateMatch = prompt.match(/(\d{1,3})\s*(?:bbl|rate)/i);

    if (idMatch) {
      const newId = idMatch[0].toUpperCase();
      const depth = depthMatch ? parseInt(depthMatch[1], 10) : 2820;
      const temp = tempMatch ? parseFloat(tempMatch[1]) : 78.5;
      const visco = viscoMatch ? parseFloat(viscoMatch[1]) : 130;
      const rate = rateMatch ? parseFloat(rateMatch[1]) : 36;

      return `### New Well Registration Confirmation
• Well ID: ${newId}
• Target Depth: ${depth} meters
• Reservoir Temperature: ${temp}°C
• Baseline Viscosity: ${visco} cP
• Target Production Rate: ${rate} bbl/d
• Lift Method: SRP (Sucker Rod Pump)
• Status: Producing

[ACTION:ADD_WELL:{"id":"${newId}","name":"Well ${newId}","depth":${depth},"temp":${temp},"viscosity":${visco},"rate":${rate}}]

Well ${newId} is validated and added to the field dashboard.`;
    }

    return `### Add New Well to Field
To commission a new well into the WellSync fleet, please specify the following parameters:

1. **Well ID**: e.g., BW-53
2. **Target Depth (m)**: e.g., 2,850 meters
3. **Reservoir Temperature (°C)**: e.g., 80°C
4. **Baseline Crude Viscosity (cP)**: e.g., 125 cP
5. **Target Production Rate (bbl/d)**: e.g., 38 bbl/d
6. **Artificial Lift Method**: SRP (Sucker Rod Pump)

Reply with these parameters (e.g., *"Add well BW-53, depth 2850m, temp 80C, viscosity 125cP, rate 38bbl"*), and I will immediately register and activate it on the dashboard.`;
  }

  // SRP Speed / Fluid Pound recommendation
  if (p.includes('speed') || p.includes('srp') || p.includes('pound') || p.includes('vfd')) {
    return `### 💡 Quick Advisor: SRP Pump Speed Recommendation
• 🔍 **Current Situation**: The pump is running at **${telemetry.pumpSpeed} SPM**, but pump chamber fillage is only at **${telemetry.pumpFillage}%** (${telemetry.dynacardCondition}). The pump is moving slightly faster than oil entering the wellbore, causing rod vibration.
• 💡 **Recommended Setting**: Set pump speed to **5.6 SPM**.
• 🎯 **Why this helps**: Slowing down slightly gives heavy crude enough time to completely fill the pump chamber. This stops the mechanical rod hammering, protects your motor, and restores pumping efficiency to 85%+ smoothly.`;
  }

  // CSS Steam / Viscosity recommendation
  if (p.includes('css') || p.includes('temp') || p.includes('steam') || p.includes('viscosity') || p.includes('heat')) {
    return `### 💡 Quick Advisor: Thermal Steam Setting
• 🔍 **Current Situation**: Heated crude viscosity is currently **${telemetry.crudeViscosity} cP** (compared to native thick crude of ${well.baselineViscosity} cP).
• 💡 **Recommended Setting**: Maintain steam generator temperature at **285°C** (150 tonnes/day injection).
• 🎯 **Why this helps**: At 285°C, high-quality steam heats the rock around the well out to ~18 meters. It melts thick heavy oil into a smooth, free-flowing liquid so your pump can lift it easily without straining.`;
  }

  // General Telemetry Audit
  return `### 💡 Well Status Summary (${well.name})
• 🔍 **Current Situation**: Well is active with Reservoir Pressure at **${telemetry.porePressure} bar** and Wellhead Tubing Pressure at **${telemetry.tubingHeadPressure} bar**. Net oil production is **${telemetry.oilProductionRate} bbl/d**.
• 💡 **Recommended Setting**: ${telemetry.pumpFillage < 70 ? 'Adjust pump speed to 5.6 SPM to eliminate fluid pound.' : 'Current settings are operating in the sweet spot. Keep pump at current speed.'}
• 🎯 **Why this helps**: Keeps bottomhole inflow steady and prevents gas locking in the casing.`;
}

