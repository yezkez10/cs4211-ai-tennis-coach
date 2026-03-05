# CS4211 Project 4 — AI Sports Coach with LLM & Formal Methods

This project builds an AI Sports Coach that bridges natural language queries with formal verification using the PAT model checker. Unlike traditional LLM chatbots that hallucinate probabilities, the system acts as a tool-using agent: it translates user questions into parametric PCSP# models, runs PAT to compute verified win probabilities, and synthesises the results into actionable coaching advice. The two core analysis modes are Reachability (predicting win probability) and Sensitivity (optimising player strategy).

The system is implemented in Python and integrates an LLM (GPT-4o or Gemini 1.5 Pro) for natural language understanding and tool orchestration, a player statistics database for real match data, and PAT for formal verification. The primary interface is a CLI, with a parametric PCSP# tennis tiebreak model at its core that accepts injected player statistics as parameters.
