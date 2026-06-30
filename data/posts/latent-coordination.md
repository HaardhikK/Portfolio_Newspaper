I tested one narrow question: when several agents work on a multi step data analysis task, do they need to talk to each other in natural language, or can they coordinate by sharing their internal hidden states and still stay accurate while spending less compute and time.

The result is positive in the regime I care about and honest about its limit. Latent coordination matched both a single agent and a normal text based multi agent on short and medium tasks, with zero decoded coordination tokens and about twice the speed. On long dependent chains the training free latent channel breaks down while text degrades only gently, which points exactly at what the next stage would need to fix.

## Why it matters

This sits inside a larger idea: a general closed loop discovery system. Systems like Google's AI co-scientist generate and debate hypotheses but stop before the slow part, which is analysing the raw data a test produces. Robin closes that loop with a data analysis agent that writes and runs code on results and feeds the findings into the next round. That loop runs several independent trajectories and reconciles them by passing written reports and voting in text, which is dependable but pays for several full text outputs every round.

If the trajectories instead share their last layer hidden states while they work, they can reach a consensus in representation space and keep the cross checking at much lower cost. The final voting step is a bounded exchange, which is the short to medium regime. So the narrow experiment below is a probe of whether the latent core of that bigger system can hold up.

## What is new here

This is not a re run of LatentMAS, which showed training free latent collaboration on reasoning tasks that decode once at the end. I added three things:

1. A real tool using loop: the agents write Python, the code runs on data, and the result is fed back into the shared latent memory before the next step. So latent coordination is tested across a code execution boundary, not pure reasoning.
2. A hybrid repair path: latent on the happy path, and an explicit text grounding step carrying the error and traceback when code fails.
3. A horizon scaling study over 3, 5 and 7 dependent stages, measuring where latent holds and where it breaks against the text baseline.

## Setup

- Local: my laptop, RTX 4050 Laptop GPU, 6 GB VRAM, under WSL2. Model Qwen3-1.7B, used to build and debug.
- Cloud: Kaggle free T4 (16 GB). Model Qwen3-8B in 4 bit, the first setting where accuracy is meaningful.
- Tasks: multi step CSV analysis where the agent writes and runs Python, in 3, 5 and 7 step versions, across three families (marketing ROI, order KPIs, sensor quality). Output is scored automatically.
- Modes, all on the same model: A single agent, B text multi agent (planner, coder, critic in text), C latent multi agent (same roles, handoffs through shared hidden states instead of text).

## Results

### Accuracy (pass rate out of 1.0)

| Mode | Short (3) | Medium (5) | Long (7) |
|---|---|---|---|
| A, single agent | 1.00 | 1.00 | 1.00 |
| B, text multi agent | 0.93 | 0.87 | 0.80 |
| C, latent multi agent | 1.00 | 1.00 | 0.20 |

### Efficiency, text (B) versus latent (C)

| Length | B coord tokens | C coord tokens | B time | C time |
|---|---|---|---|---|
| Short | about 979 | 0 | about 59 s | about 33 s |
| Medium | about 1768 | 0 | about 74 s | about 35 s |
| Long | about 2677 | 0 | about 104 s | about 103 s |

A few things stand out:

- Short and medium: latent matched both the single agent and text at full accuracy, with 0 coordination tokens and about twice the speed. This is the bounded regime that matches a final voting and consensus step.
- Long (7 steps): latent accuracy dropped to 0.20 while the single agent stayed at 1.00 and text held at 0.80. The tasks are solvable, so the breakdown is in the latent coordination over a long chain, not the tasks. Its speed advantage also disappears here, because latent runs the full process, fails, retries, and still fails.
- Both repair settings, hybrid and pure latent, failed the same way at long length, so the collapse is a property of latent coordination itself, not the repair method.
- The long failures concentrated on the families whose final step needs fitting a model and predicting. The simpler aggregation family partly survived, so the shared state seems to lose the hardest, latest instructions first.

## Where this is going, and why I paused

The clean way past the long horizon limit is to stop relying on the training free version and train a small latent module so the shared state stays faithful over longer chains. That is the RecursiveMAS direction, the trained successor to LatentMAS. The other axis is a larger coder model to see how much of the gap is model scale, plus latent memory management and a per stage run then observe loop.

Both need a 24 GB or larger GPU I do not have access to right now, so I paused here. Everything above was done on my laptop and on free Kaggle time, taken as far as it can fairly go.

## References

- RecursiveMAS, training latent cross trajectory links. [recursivemas.github.io](https://recursivemas.github.io/)
- Robin: a closed loop discovery agent. Nature, 2026. [nature.com](https://www.nature.com/articles/s41586-026-10652-y)
- Towards an AI co-scientist. Google, 2025. [arXiv:2502.18864](https://arxiv.org/abs/2502.18864)
- ScienceAgentBench. [arXiv:2410.05080](https://arxiv.org/abs/2410.05080)
