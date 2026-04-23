import "./App.css";
import { useState, useEffect } from "react";

// Attack Nodes
const nodes = {
  phishing: { requires: [], produces: ["credentials"] },
  brute: { requires: [], produces: ["credentials"] },

  login: { requires: ["credentials"], produces: ["user_access"] },

  // 🔥 NEW
  credential_dump: { requires: ["user_access"], produces: ["credentials"] },
  persistence: { requires: ["user_access"], produces: ["persistent_access"] },
  lateral_move: { requires: ["user_access"], produces: ["network_access"] },

  escalate: { requires: ["user_access"], produces: ["admin_access"] },

  // 🔥 NEW ADVANCED PATHS
  privilege_chain: { requires: ["network_access"], produces: ["admin_access"] },
  data_staging: { requires: ["admin_access"], produces: ["staged_data"] },

  exfiltrate: { requires: ["admin_access"], produces: ["data_exfiltrated"] },

  // 🔥 ALTERNATE EXFIL PATH
  stealth_exfiltrate: {
    requires: ["staged_data", "persistent_access"],
    produces: ["data_exfiltrated"]
  }
};

const nodeInfo = {
  phishing: {
    tactic: "Initial Access",
    description: "Trick users into revealing credentials",
    real: "Email phishing campaigns",
    defense: "User training, email filters, MFA"
  },
  brute: {
    tactic: "Credential Access",
    description: "Guess passwords using repeated attempts",
    real: "Credential stuffing attacks",
    defense: "Rate limiting, MFA, strong passwords"
  },
  login: {
    tactic: "Execution",
    description: "Use credentials to access system",
    real: "Account takeover",
    defense: "Monitor login anomalies"
  },
  escalate: {
    tactic: "Privilege Escalation",
    description: "Gain higher-level access",
    real: "Privilege abuse",
    defense: "Least privilege principle"
  },
  lateral_move: {
    tactic: "Lateral Movement",
    description: "Move across internal systems",
    real: "Pivoting across network",
    defense: "Network segmentation"
  },
  exfiltrate: {
    tactic: "Exfiltration",
    description: "Extract sensitive data",
    real: "Data breach",
    defense: "DLP systems"
  }
};

// Fisher-Yates Shuffle
function shuffleArray(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleCategories(categories) {
  const shuffled = {};

  Object.entries(categories).forEach(([key, list]) => {
    shuffled[key] = shuffleArray(list);
  });

  return shuffled;
}

// 🔴 STEP 1: Failure-aware validator
function validateWithTrace(chain, level) {
  let state = new Set(level.initial_state);

  for (let i = 0; i < chain.length; i++) {
    const step = chain[i];

    if (!level.allowed.includes(step)) {
      return { success: false, failedIndex: i, message: `Cannot ${step} → Not allowed` };
    }

    const node = nodes[step];
    const missing = node.requires.filter(r => !state.has(r));

    if (missing.length > 0) {
      return {
        success: false,
        failedIndex: i,
        message: `Cannot ${step} → Missing: ${missing.join(", ")}`
      };
    }

    node.produces.forEach(p => state.add(p));
  }

  const goals = Array.isArray(level.goal) ? level.goal : [level.goal];

  if (!goals.every(g => state.has(g))) {
    return {
      success: false,
      failedIndex: chain.length - 1,
      message: `Goal not reached: ${goals.join(", ")}`
    };
  }

  return { success: true };
}


// Levels
const presetLevels = [
  {
    name: "Credential Phishing Campaign",
    description: "An attacker uses phishing emails to steal employee credentials and gain access.",
    goal: "data_exfiltrated",
    initial_state: [],
    optimal: 4,
    allowed: ["phishing","login","escalate","exfiltrate"],
    hint: "Basic credential theft"
  },

  {
    name: "Credential Stuffing Attack",
    description: "An attacker exploits reused passwords to gain unauthorized account access.",
    goal: "data_exfiltrated",
    initial_state: [],
    optimal: 4,
    allowed: ["brute","login","escalate","exfiltrate"],
    hint: "Guess passwords"
  },

  {
    name: "Open S3 Bucket Exposure",
    description: "Sensitive data is publicly exposed due to misconfigured cloud storage.",
    goal: "data_exfiltrated",
    initial_state: ["admin_access"],
    optimal: 1,
    allowed: ["exfiltrate"],
    hint: "Misconfigured system"
  },

  {
    name: "Credential Dumping Attack",
    description: "An attacker extracts stored credentials after gaining initial system access.",
    goal: "data_exfiltrated",
    initial_state: [],
    optimal: 5,
    allowed: ["phishing","login","credential_dump","escalate","exfiltrate"],
    hint: "Extract credentials"
  },

  {
    name: "Persistence Attack",
    description: "An attacker establishes long-term access before executing data exfiltration.",
    goal: ["data_exfiltrated","persistent_access"],
    initial_state: [],
    optimal: 5,
    allowed: ["phishing","login","persistence","escalate","exfiltrate"],
    hint: "Maintain access"
  },

  {
    name: "Lateral Movement Attack",
    description: "An attacker moves across internal systems to gain broader network control.",
    goal: "data_exfiltrated",
    initial_state: [],
    optimal: 5,
    allowed: ["phishing","login","lateral_move","privilege_chain","exfiltrate"],
    hint: "Move across network"
  },

  {
    name: "Multi-Stage Breach",
    description: "A complex attack combining multiple techniques to achieve full system compromise.",
    goal: "data_exfiltrated",
    initial_state: [],
    optimal: 6,
    allowed: ["phishing","login","credential_dump","lateral_move","privilege_chain","exfiltrate"],
    hint: "Combine techniques"
  },

  {
    name: "Data Staging Attack",
    description: "Data is prepared and staged internally before being exfiltrated.",
    goal: "data_exfiltrated",
    initial_state: [],
    optimal: 6,
    allowed: ["phishing","login","escalate","data_staging","stealth_exfiltrate"],
    hint: "Stage data first"
  },

  {
    name: "Stealth Exfiltration",
    description: "An attacker extracts data while maintaining persistence to avoid detection.",
    goal: "data_exfiltrated",
    initial_state: [],
    optimal: 7,
    allowed: ["phishing","login","persistence","escalate","data_staging","stealth_exfiltrate"],
    hint: "Avoid detection"
  },

  {
    name: "Advanced Persistent Threat",
    description: "A highly sophisticated multi-stage attack involving persistence, movement, and stealth.",
    goal: "data_exfiltrated",
    initial_state: [],
    optimal: 8,
    allowed: Object.keys(nodes),
    hint: "Full lifecycle attack"
  }
];

const aiTemplates = [

  // BASIC
  {
    name: "Startup Phishing Breach",
    description: "An attacker targets employees in a startup environment with phishing emails to gain access.",
    hint: "Employees lack security awareness",
    allowed: ["phishing","login","escalate","exfiltrate"],
    initial_state: [],
    optimal: 4
  },

  {
    name: "Credential Stuffing Attack",
    description: "An attacker uses leaked credentials to gain unauthorized access to user accounts.",
    hint: "Users reuse passwords",
    allowed: ["brute","login","escalate","exfiltrate"],
    initial_state: [],
    optimal: 3
  },

  {
    name: "Open Cloud Storage Exposure",
    description: "Sensitive data is exposed due to publicly accessible cloud storage.",
    hint: "Public bucket misconfiguration",
    allowed: ["exfiltrate"],
    initial_state: ["admin_access"],
    optimal: 1
  },

  // INTERMEDIATE

  {
    name: "Internal Credential Dumping",
    description: "After gaining access, the attacker extracts stored credentials to expand control.",
    hint: "Gain access and extract stored credentials",
    allowed: ["phishing","login","credential_dump","escalate","exfiltrate"],
    initial_state: [],
    optimal: 5
  },

  {
    name: "Lateral Movement Campaign",
    description: "The attacker pivots across systems to expand access within the network.",
    hint: "Move across internal systems",
    allowed: ["phishing","login","lateral_move","privilege_chain","exfiltrate"],
    initial_state: [],
    optimal: 5
  },

  {
    name: "Persistence-Based Breach",
    description: "The attacker establishes persistence before escalating privileges and exfiltrating data.",
    hint: "Maintain access before escalation",
    allowed: ["phishing","login","persistence","escalate","exfiltrate"],
    initial_state: [],
    optimal: 5
  },

  // ADVANCED

  {
    name: "Stealth Data Exfiltration",
    description: "The attacker prepares and extracts data stealthily to avoid detection.",
    hint: "Prepare and extract data without detection",
    allowed: ["phishing","login","escalate","data_staging","stealth_exfiltrate"],
    initial_state: [],
    optimal: 6
  },

  {
    name: "Advanced Lateral Escalation",
    description: "The attacker uses lateral movement to gain elevated privileges before extracting data.",
    hint: "Pivot through network to gain admin",
    allowed: ["phishing","login","lateral_move","privilege_chain","data_staging","exfiltrate"],
    initial_state: [],
    optimal: 6
  },

  {
    name: "Insider Threat Scenario",
    description: "A trusted insider abuses existing access to stage and exfiltrate sensitive data.",
    hint: "User already has access",
    allowed: ["persistence","data_staging","stealth_exfiltrate"],
    initial_state: ["user_access"],
    optimal: 4
  },

  // COMPLEX

  {
    name: "Advanced Persistent Threat (APT)",
    description: "A long-term, multi-stage attack involving persistence, movement, and stealth techniques.",
    hint: "Full multi-stage attack lifecycle",
    allowed: Object.keys(nodes),
    initial_state: [],
    optimal: 8
  },

  {
    name: "Supply Chain Compromise",
    description: "An attacker compromises trusted internal systems to propagate access and extract data.",
    hint: "Compromise trusted internal access",
    allowed: ["login","persistence","lateral_move","privilege_chain","data_staging","stealth_exfiltrate"],
    initial_state: ["user_access"],
    optimal: 7
  }

];

// Random Scenario Generator
function generateScenario(difficulty) {
  const base = aiTemplates[Math.floor(Math.random() * aiTemplates.length)];
  let mod = { ...base };

  // 🔹 Add small randomness (baseline variation)
  mod.optimal += Math.floor(Math.random() * 2); // 0–1

  // 🔹 Medium difficulty scaling
  if (difficulty > 60) {
    mod.allowed = Object.keys(nodes);
    mod.optimal += Math.floor(Math.random() * 2) + 1; // +1 to +2
  }

  // 🔹 High difficulty scaling
  if (difficulty > 85) {
    mod.initial_state = [];
    mod.optimal += Math.floor(Math.random() * 2) + 1; // +1 to +2
    mod.hint = "Minimal hints available";
  }

  return { ...mod, goal: "data_exfiltrated" };
}

// Validation (UNCHANGED)
function validate(chain, level) {
  if (chain.length === 0) {
    return { success: false, message: "No attack steps" };
  }

  let state = new Set(level.initial_state);

  for (let step of chain) {
    if (!level.allowed.includes(step)) {
      return { success: false, message: "Attack not allowed" };
    }

    const node = nodes[step];
    const missing = node.requires.filter(r => !state.has(r));
    if (missing.length > 0) {
      return { success: false, message: `Missing: ${missing.join(", ")}` };
    }

    node.produces.forEach(p => state.add(p));
  }

  const goals = Array.isArray(level.goal) ? level.goal : [level.goal];

if (!goals.every(g => state.has(g))) {
  return {
    success: false,
    message: `Goal not reached: ${goals.join(", ")}`
  };
}

  let efficiency = (level.optimal / chain.length) * 100;

  return {
    success: true,
    score: Math.round(efficiency),
    message: "Success"
  };
}

// Compute current state
function getCurrentState(chain, level) {
  let state = new Set(level.initial_state);

  for (let step of chain) {
    const node = nodes[step];
    if (!node) continue;

    const missing = node.requires.filter(r => !state.has(r));
    if (missing.length > 0) break;

    node.produces.forEach(p => state.add(p));
  }

  return state;
}

export default function App() {

  const [mode, setMode] = useState("levels");
  const [levelIndex, setLevelIndex] = useState(0);
  const [aiLevel, setAiLevel] = useState(generateScenario(50));
  const [isLocked, setIsLocked] = useState(false);
  const [chain, setChain] = useState([]);
  const [result, setResult] = useState("");
  const [failedStepIndex, setFailedStepIndex] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [time, setTime] = useState(0);
  const [guidedMode, setGuidedMode] = useState(false);
  const [difficulty, setDifficulty] = useState(50);
  const [isRunning, setIsRunning] = useState(true);
  const [shuffledNodes, setShuffledNodes] = useState([]);
  const [completedLevels, setCompletedLevels] = useState([0]);
  const [shuffledCategories, setShuffledCategories] = useState({});
  const level = mode === "levels" ? presetLevels[levelIndex] : aiLevel;
  const [started, setStarted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showBriefing, setShowBriefing] = useState(true);

  const reshuffle = () => {
    setShuffledNodes(shuffleArray(Object.keys(nodes)));
    setShuffledCategories(shuffleCategories(categories));
  };

  useEffect(() => {
    reshuffle();
  }, []);

  useEffect(() => {
  if (!isRunning) return;

  const i = setInterval(() => {
    setTime(t => t + 1);
  }, 1000);

  return () => clearInterval(i);
}, [isRunning]);

useEffect(() => {
  setShowBriefing(true);
}, [levelIndex, aiLevel]);

useEffect(() => {
  setChain([]);
  setResult("");
  setFailedStepIndex(null);
  setSelectedStep(null);

  setTime(0);        // reset timer
  setIsRunning(true);
  setIsLocked(false); 
  reshuffle();       // reshuffle nodes for new level/mode
}, [mode, levelIndex, aiLevel]);

  const currentState = getCurrentState(chain, level);
  const validSteps = Object.keys(nodes).filter(n =>
  nodes[n].requires.every(r => currentState.has(r))
);
  // ✅ FIXED: use trace instead of validate
  const liveStatus =
    chain.length === 0
      ? "Start building..."
      : validateWithTrace(chain, level).message;
  
  const categories = {
    "Initial Access": ["phishing","brute"],
    "Privilege": ["login","escalate","privilege_chain"],
    "Movement": ["lateral_move"],
    "Persistence": ["persistence"],
    "Data Ops": ["credential_dump","data_staging"],
    "Exfiltration": ["exfiltrate","stealth_exfiltrate"]
  };
  
  if (!started) {
  return (
    <div className={`fade-screen ${isVisible ? "show" : "hide"}`}>
    <div className="start-screen">
      <div className="start-card">
        <h1>Attack Path Simulator</h1>

        <p>
          Build and analyze real-world cyber attack paths by chaining techniques like phishing, escalation, and data exfiltration.
        </p>

        <div style={{ marginTop: 20 }}>
          <button
            className="btn primary"
            onClick={() => {
  setIsVisible(false);
  setTimeout(() => {
    setMode("levels");
    setStarted(true);
    setShowBriefing(true);
    setIsVisible(true);
  }, 300);
}}
          >
            Start with Levels
          </button>

          <button
            className="btn"
            style={{ marginLeft: 10 }}
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setMode("random");
                setStarted(true);
                setShowBriefing(true);
                setIsVisible(true);
              }, 300);
            }}
          >
            Start with Random Scenario
          </button>

          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 15 }}>
  Choose a mode to begin simulation
</p>

        </div>
      </div>
    </div>
    </div>
  );
}
  
  if (started && showBriefing) {
  return (
    <div className="start-screen">
      <div className="start-card">
        <h2>{level.name}</h2>

        <p style={{ marginBottom: 10 }}>
          {level.description || "No description available."}
        </p>

        <hr />

        <p>
          <b>Goal:</b>{" "}
          {Array.isArray(level.goal)
            ? level.goal.join(" + ")
            : level.goal}
        </p>

        <p>
          <b>Starting State:</b>{" "}
          {level.initial_state.length > 0
            ? level.initial_state.join(", ")
            : "None"}
        </p>

        <p>
          <b>Optimal Path Length:</b> {level.optimal}
        </p>

        <button
          className="btn primary"
          style={{ marginTop: 15 }}
          onClick={() => setShowBriefing(false)}
        >
          Start Simulation
        </button>
      </div>
    </div>
  );
}

  return (
    <div className={`fade-screen ${isVisible ? "show" : "hide"}`}>
    <div className="container">

      {/* LEFT */}
<div className="panel left">

<button className="btn" onClick={() => {
  setIsVisible(false);
  setTimeout(() => {
    setStarted(false);
    setIsVisible(true);
  }, 300);
}}>
  🏡 Home
</button>

  <h2>{level.name}</h2>
  <p>
  Goal: {Array.isArray(level.goal)
    ? level.goal.join(" + ")
    : level.goal}
</p>
  <p>⏱ {time}s</p>

  <h3>
    Mode: {mode === "levels" ? "Level Mode" : "Random Scenario Generator"}
  </h3>

  <button
    className={`btn ${mode === "levels" ? "active" : ""}`}
    onClick={() => setMode("levels")}
  >
    Levels
  </button>

  <button
    className={`btn ${mode === "random" ? "active" : ""}`}
    onClick={() => setMode("random")}
  >
    Random
  </button>

  {/* LEVEL MODE */}
  {mode === "levels" && (
    <>
      <h3>Levels</h3>
      {presetLevels.map((_, i) => {
        const isUnlocked = completedLevels.includes(i);

        return (
          <button
            key={i}
            disabled={!isUnlocked}
            title={!isUnlocked ? "Complete previous level to unlock" : ""}
            className={`btn ${i === levelIndex ? "active" : ""} ${
              !isUnlocked ? "locked" : ""
            }`}
            onClick={() => {
              if (!isUnlocked) return;

              setLevelIndex(i);
              setChain([]);
              setResult("");
              setFailedStepIndex(null);
              setSelectedStep(null);
              setIsRunning(true);
              reshuffle();
            }}
          >
            {isUnlocked ? `L${i + 1}` : `🔒 L${i + 1}`}
          </button>
        );
      })}
    </>
  )}

  {/* RANDOM MODE */}
  {mode === "random" && (
    <>
      <h3>Difficulty: {difficulty}</h3>

      <input
        type="range"
        min="0"
        max="100"
        value={difficulty}
        onChange={(e) => setDifficulty(Number(e.target.value))}
      />

      <br /><br />

      <button
        className="btn"
        onClick={() => {
          setAiLevel(generateScenario(difficulty));
          setChain([]);
          setResult("");
          setFailedStepIndex(null);
          setSelectedStep(null);
          setIsRunning(true);
          reshuffle();
        }}
      >
        Random Scenario
      </button>
    </>
  )}

  <h4>Hint</h4>
  <p>{level.hint}</p>

  <div style={{ marginTop: 15 }}>
  <span style={{ marginRight: 10 }}>Guided Mode</span>

  <label className="switch">
    <input
      type="checkbox"
      checked={guidedMode}
      onChange={() => setGuidedMode(!guidedMode)}
    />
    <span className="slider"></span>
  </label>

  <p style={{ marginTop: 5, color: guidedMode ? "#22c55e" : "#94a3b8" }}>
  ● {guidedMode ? "ON" : "OFF"}
</p>
</div>
  

</div>

      {/* CENTER */}
      <div className="panel center">
        <h2>Attack Builder</h2>

        {Object.entries(shuffledCategories).map(([category, nodeList]) => (
  <div key={category} style={{ marginBottom: 15 }}>
    
    <h4 style={{ opacity: 0.7 }}>{category}</h4>

    {nodeList.map(n => {
  const isValid = validSteps.includes(n);

  return (
    <button
      key={n}
      className={`btn ${isLocked ? "locked" : ""}`}
      style={{
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity: isLocked
          ? 0.5
          : guidedMode
          ? isValid
            ? 1
            : 0.3
          : 1,
        border: guidedMode && isValid ? "1px solid #22c55e" : undefined
      }}
      onClick={() => {
        if (isLocked) return;

        // optional strict mode: block invalid clicks
        if (guidedMode && !isValid) return;

        setChain([...chain, n]);
        setSelectedStep(n);
        setResult("");
        setFailedStepIndex(null);
      }}
    >
      {n}
    </button>
  );
})}

  </div>
))}

        <p>
          Chain:{" "}
          {chain.length === 0
            ? "None"
            : chain.map((step, i) => (
                <span
                  key={i}
                  className={i === failedStepIndex ? "fail" : ""}
                >
                  {step}
                  {i !== chain.length - 1 && " → "}
                </span>
              ))}
        </p>

        <p>Status: {liveStatus}</p>
        <p>State: {[...currentState].join(", ") || "None"}</p>

        <button
          className="btn"
          onClick={() => {
  setChain([]);
  setResult("");
  setFailedStepIndex(null);
  setSelectedStep(null);

  setTime(0);          // ⭐ reset timer
  setIsRunning(true);  // ⭐ restart timer
  setIsLocked(false);
  reshuffle();
}}
        >
          Reset
        </button>

        <button
          className="btn"
          onClick={() => {
            if (isLocked) return;

            setChain(chain.slice(0, -1));
            setResult("");
            setFailedStepIndex(null);
          }}
        >
          Undo
        </button>

        <button
          className="btn"
          onClick={() => {
    if (isLocked) return; // 🚫 prevent re-validation

    const trace = validateWithTrace(chain, level);

    setIsRunning(false);   // ⛔ stop timer
    setIsLocked(true);     // 🔒 lock interaction

    if (!trace.success) {
      setFailedStepIndex(trace.failedIndex);
      setResult(trace.message);
    } else {
      setFailedStepIndex(null);

      const res = validate(chain, level);
      let score = res.score - Math.floor(time / 2);
      if (score < 0) score = 0;

      setResult(`Score: ${score}`);

      // 🔓 unlock next level
      if (mode === "levels" && !completedLevels.includes(levelIndex + 1)) {
        setCompletedLevels(prev => [...prev, levelIndex + 1]);
      }
    }

    
  }}
        >
          Validate
        </button>
      </div>

      {/* RIGHT */}
      <div className="panel right">
        <div className="analysis">
          <h2>Attack Analysis</h2>

          <p
  style={{
    color: result.includes("Score")
      ? "#22c55e"
      : result.includes("Missing") ||
        result.includes("Cannot") ||
        result.includes("Goal")
      ? "#ef4444"
      : "#facc15"
  }}
>
  {result.includes("Score") && "✅ "}
  {(result.includes("Missing") ||
    result.includes("Cannot") ||
    result.includes("Goal")) && "❌ "}
  {result}
</p>

          <hr />

          <p>Time: {time}s</p>
          <p>Steps: {chain.length}</p>
          <p>Optimal Path Length: {level.optimal}</p>

          <hr />
          
          {selectedStep && nodeInfo[selectedStep] && (
  <>
    <h4>Step Info</h4>

    <p><b>Tactic:</b> {nodeInfo[selectedStep].tactic}</p>
    <p>{nodeInfo[selectedStep].description}</p>

    <p><b>Real-world:</b> {nodeInfo[selectedStep].real}</p>

    <h4>Defense</h4>
    <p>{nodeInfo[selectedStep].defense}</p>

    <hr />
  </>
)}

          <p>Execution Trace:</p>
          {chain.map((step, i) => (
            <p key={i}>
              {i + 1}. {step} → {nodes[step].produces.join(", ")}
            </p>
          ))}
        </div>
      </div>

    </div>
  </div>
);
}