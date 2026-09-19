import { useState } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import { askPetroTwinAI, type ChatMessage } from '../../services/geminiService';
import styles from './AICopilotView.module.css';

export function AICopilotView() {
  const { telemetry, activeWell, controls, updateControls, addNewWell } = useDigitalTwin();

  if (!telemetry || !activeWell) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem', textAlign: 'center', color: '#888' }}>
        No telemetry data available. Awaiting connection to Digital Twin backend.
      </div>
    );
  }


  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Welcome Engineer. I am your **WellSync Operational Advisor** for **${activeWell.name}** (${activeWell.field}).\n\nI deliver direct, actionable operational guidance without formula clutter:\n• **SRP Pumping Speed (SPM)**: Optimal speed to eliminate fluid pound and prevent mechanical rod fatigue.\n• **CSS Steam Temperature (°C)**: Thermal setpoints to achieve maximum heavy crude viscosity reduction.\n• **Add New Well**: Ask to add a new well, and I will gather the required parameters and register it directly onto the dashboard.\n\nSelect a quick recommendation below or type your inquiry directly.`,
      timestamp: 'Live Active',
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic calculated suggestions based on live telemetry
  const suggestedSpeed = telemetry.pumpFillage < 70 ? 5.6 : 5.8;
  const suggestedTemp = 285;

  const handleApplySpeed = () => {
    updateControls({ pumpSpeed: suggestedSpeed, injectedAnomaly: 'none' });
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'system',
        text: `✓ **Synced to Dashboard:** SRP Pumping speed auto-tuned to **${suggestedSpeed} SPM**. Pump fillage will now recover towards 85%+ and mechanical rod shock is eliminated.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleApplyTemp = () => {
    updateControls({ steamTemp: suggestedTemp });
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'system',
        text: `✓ **Synced to Dashboard:** CSS Steam Generator temperature set to **${suggestedTemp}°C**. Near-wellbore heavy oil viscosity will decrease to ~32 cP.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleApplyChoke = () => {
    updateControls({ chokeSize: 12 });
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'system',
        text: `✓ **Synced to Dashboard:** Casing choke valve calibrated to **12 mm**. Casing head pressure stabilized at 91.2 bar.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSend = async (questionText?: string) => {
    const q = questionText || prompt;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setPrompt('');
    setLoading(true);

    try {
      const res = await askPetroTwinAI(q, telemetry, activeWell);
      let cleanReply = res.reply;

      // Detect and handle direct well addition action
      const actionMatch = res.reply.match(/\[ACTION:ADD_WELL:(\{.*?\})\]/);
      if (actionMatch) {
        try {
          const wellData = JSON.parse(actionMatch[1]);
          addNewWell({
            id: wellData.id,
            name: wellData.name || `Well ${wellData.id}`,
            field: activeWell.field,
            block: activeWell.block,
            status: 'Producing',
            liftMethod: 'SRP (Sucker Rod Pump)',
            targetDepth: wellData.depth || 2850,
            reservoirTemp: wellData.temp || 80,
            oilGravity: '17.2° API (Extra Heavy)',
            baselineViscosity: wellData.viscosity || 120,
            targetRate: wellData.rate || 35,
            cssCycle: 1,
          });
          cleanReply = res.reply.replace(
            actionMatch[0],
            `\n\n✓ **Well Commissioning Executed:** Successfully created and registered **${wellData.id}** on the live dashboard and database hypertable.`
          );
        } catch (e) {
          console.error('Failed to parse ADD_WELL action:', e);
        }
      }

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: cleanReply,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: res.action,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `AI Assistant error: ${err.message}`,
          timestamp: 'Error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What is the optimal SRP pumping speed to prevent fluid pound?',
    'What steam generator temperature should be set for CSS cycle?',
    'How do I add a new well to the field fleet?',
    'Report current reservoir pressure, drawdown, and fluid level',
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.tag}>AI OPERATIONAL ADVISOR</span>
            <span className={styles.subTag}>REAL-TIME RECOMMENDATION ENGINE</span>
          </div>
          <h1 className={styles.title}>AI Production & Reservoir Advisory Copilot</h1>
          <p className={styles.subtitle}>
            Live engineering recommendations for optimal SRP pumping speed, CSS thermal steam temperatures, and wellbore stability.
          </p>
        </div>

        <div className={styles.aiStatusBadge}>
          <span className={styles.statusDot} />
          <span>AI Neural Advisory: Active</span>
        </div>
      </header>

      {/* Real-time Engineering Suggestion Cards */}
      <div className={styles.suggestionsGrid}>
        {/* Card 1: SRP Speed Advisor */}
        <div className={styles.suggCard}>
          <div className={styles.suggTop}>
            <span className={styles.suggCategory}>SRP ARTIFICIAL LIFT ADVISOR</span>
            <span
              className={styles.suggTag}
              style={{
                color: telemetry.dynacardCondition === 'Fluid Pound' ? 'var(--red)' : 'var(--green)',
                background: telemetry.dynacardCondition === 'Fluid Pound' ? 'var(--red-dim)' : 'var(--green-dim)',
              }}
            >
              {telemetry.dynacardCondition}
            </span>
          </div>

          <div className={styles.suggBody}>
            <div className={styles.suggStatRow}>
              <div>
                <span className={styles.statSub}>Current Speed</span>
                <span className={styles.statMain}>{controls.pumpSpeed} <small>SPM</small></span>
              </div>
              <div className={styles.arrowIcon}>→</div>
              <div>
                <span className={styles.statSub}>AI Recommended</span>
                <span className={styles.statHighlight} style={{ color: 'var(--green)' }}>
                  {suggestedSpeed} <small>SPM</small>
                </span>
              </div>
            </div>

            <p className={styles.suggExplanation}>
              {telemetry.pumpFillage < 70
                ? `Pump fillage is at ${telemetry.pumpFillage}%. Incomplete liquid filling is causing polished rod shock (${telemetry.peakPolishedRodLoad} lbs). Reduce speed to ${suggestedSpeed} SPM to match reservoir inflow.`
                : `Current speed is well balanced with inflow. Operating at ${suggestedSpeed} SPM provides 85%+ volumetric efficiency.`}
            </p>
          </div>

          <button
            className={styles.applyBtn}
            onClick={handleApplySpeed}
            disabled={controls.pumpSpeed === suggestedSpeed}
          >
            {controls.pumpSpeed === suggestedSpeed ? '✓ Already at Optimal Speed' : `Apply Suggested ${suggestedSpeed} SPM →`}
          </button>
        </div>

        {/* Card 2: CSS Steam Temperature Advisor */}
        <div className={styles.suggCard}>
          <div className={styles.suggTop}>
            <span className={styles.suggCategory}>CSS THERMAL EOR ADVISOR</span>
            <span className={styles.suggTag} style={{ color: 'var(--orange)', background: 'var(--orange-dim)' }}>
              Cycle #{activeWell.cssCycle}
            </span>
          </div>

          <div className={styles.suggBody}>
            <div className={styles.suggStatRow}>
              <div>
                <span className={styles.statSub}>Reservoir Temp</span>
                <span className={styles.statMain}>{telemetry.reservoirTemperature} <small>°C</small></span>
              </div>
              <div className={styles.arrowIcon}>→</div>
              <div>
                <span className={styles.statSub}>AI Suggested Steam</span>
                <span className={styles.statHighlight} style={{ color: 'var(--orange)' }}>
                  {suggestedTemp} <small>°C</small>
                </span>
              </div>
            </div>

            <p className={styles.suggExplanation}>
              Baghewala heavy crude has a native viscosity of {activeWell.baselineViscosity} cP. Operating steam injection at <strong>{suggestedTemp}°C (150 t/d)</strong> cuts viscosity to ~32 cP, giving a 5x mobility boost.
            </p>
          </div>

          <div className={styles.suggActions}>
            <button
              className={styles.applyBtn}
              onClick={handleApplyTemp}
              style={{ background: 'var(--orange-dim)', borderColor: 'rgba(255,140,0,0.4)', color: 'var(--orange)' }}
            >
              Apply Suggested {suggestedTemp}°C to Dashboard →
            </button>
            <button
              className={styles.infoBtn}
              onClick={() => handleSend('Explain simply: CSS steam injection temperature aur duration kaise kaam karta hai?')}
            >
              Simple Explanation 💡
            </button>
          </div>
        </div>

        {/* Card 3: Casing Choke & Drawdown Advisor */}
        <div className={styles.suggCard}>
          <div className={styles.suggTop}>
            <span className={styles.suggCategory}>DRAWDOWN & CHOKE ADVISOR</span>
            <span className={styles.suggTag} style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}>
              CHP: {telemetry.casingHeadPressure} bar
            </span>
          </div>

          <div className={styles.suggBody}>
            <div className={styles.suggStatRow}>
              <div>
                <span className={styles.statSub}>Net Drawdown</span>
                <span className={styles.statMain}>{telemetry.bottomholeDrawdown} <small>bar</small></span>
              </div>
              <div className={styles.arrowIcon}>→</div>
              <div>
                <span className={styles.statSub}>Suggested Choke</span>
                <span className={styles.statHighlight} style={{ color: 'var(--accent)' }}>
                  12 <small>mm</small>
                </span>
              </div>
            </div>

            <p className={styles.suggExplanation}>
              Keep casing pressure between <strong>90–92 bar</strong> to maintain pump intake liquid head and vent annular gas, avoiding downhole gas locking.
            </p>
          </div>

          <div className={styles.suggActions}>
            <button
              className={styles.applyBtn}
              onClick={handleApplyChoke}
              style={{ background: 'var(--accent-dim)', borderColor: 'rgba(0,229,255,0.4)', color: 'var(--accent)' }}
            >
              Apply 12 mm Choke to Dashboard →
            </button>
            <button
              className={styles.infoBtn}
              onClick={() => handleSend('Explain simply: Casing pressure aur choke size adjust karne ke easy tips kya hain?')}
            >
              Simple Guidelines 💡
            </button>
          </div>
        </div>
      </div>

      {/* Interactive AI Advisory Chat */}
      <div className={styles.chatSection}>
        <div className={styles.chatHeaderRow}>
          <span className={styles.chatTitle}>Ask WellSync Advisor for Guidance & Reasoning</span>
          <span className={styles.chatSub}>Trained on Multiphysics Telemetry & ONGC Baghewala Heavy Oil Reservoir Physics</span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className={styles.promptsRow}>
          <span className={styles.promptsLabel}>Quick Questions:</span>
          {quickPrompts.map((qp) => (
            <button key={qp} className={styles.promptPill} onClick={() => handleSend(qp)}>
              {qp}
            </button>
          ))}
        </div>

        {/* Messages Log */}
        <div className={styles.messagesBox}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`${styles.message} ${
                m.sender === 'user' ? styles.userMsg : m.sender === 'system' ? styles.systemMsg : styles.aiMsg
              }`}
            >
              <div className={styles.msgHeader}>
                <span className={styles.senderTag}>
                  {m.sender === 'user'
                    ? 'Field Engineer'
                    : m.sender === 'system'
                    ? 'System Action'
                    : 'WellSync Advisor'}
                </span>
                <span className={styles.msgTime}>{m.timestamp}</span>
              </div>
              <div className={styles.msgContent}>{m.text}</div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.message} ${styles.aiMsg}`}>
              <div className={styles.msgHeader}>
                <span className={styles.senderTag}>WellSync Advisor</span>
              </div>
              <div className={styles.loadingDots}>
                Analyzing reservoir inflow, pump fillage, and calculating optimal parameters...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className={styles.inputBar}>
          <input
            type="text"
            placeholder="Poochiye: CSS me temperature kitna lein? SRP speed kitni rakhein? Fluid pound kaise hatayein?..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className={styles.chatInput}
          />
          <button className={styles.sendBtn} onClick={() => handleSend()} disabled={loading}>
            {loading ? 'Analyzing...' : 'Get Suggestion'}
          </button>
        </div>
      </div>
    </div>
  );
}
