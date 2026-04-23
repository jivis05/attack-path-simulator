# Attack Path Simulator

Attack Path Simulator is an interactive cybersecurity simulation tool that allows users to construct and validate attack chains using real-world techniques and dependencies.

---

## Overview

This project provides a browser-based environment where users simulate attacker behavior by chaining actions such as phishing, privilege escalation, lateral movement, and data exfiltration.

Each step is validated against system constraints, helping users understand how attacks progress and why certain sequences fail. The goal is to provide a practical way to learn attack flow and defensive thinking.

---

## Features

- Build step-by-step attack chains  
- State-based validation system  
- Guided mode to highlight valid actions  
- Scoring based on efficiency and time penalty  
- Multiple levels with increasing complexity  
- Random scenario generation  
- Failure tracing with detailed explanations  
- Basic defensive insights for each step  

---

## Concepts Covered

- Initial access (phishing, brute force)  
- Privilege escalation  
- Lateral movement  
- Persistence  
- Credential dumping  
- Data staging and exfiltration  

---

## Tech Stack

- React (Vite)  
- JavaScript  
- CSS  

---

## Installation

```bash
npm install
npm run dev
