# Mira

## Problem Statement

We are solving the manual work behind creating product demo videos: teams still have to choose the workflow, capture UI states, write the script, and keep the story aligned with a fast-changing product. Our goal is to move that burden from manual scripting to intent-driven planning.

## Hackathon Scope

For the hackathon, we built a focused end-to-end loop where a user uploads screenshots, describes their intent, and gets back a generated workflow plan. We show that plan as linked steps on an interactive canvas and use it as the foundation for video generation, while leaving the longer-term CUA product traversal vision as the next step.

## Codex Usage

- Workflow plan generation from user intent and screenshots. (GPT 5.5)
- Video creative direction: title, scenes, motion, callouts, image backgrounds, and copy (GPT Image 2)
- Realtime voice transcription in the message composer. (OpenAI Realtime ASR)
