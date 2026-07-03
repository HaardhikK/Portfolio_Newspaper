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

## Update - July 3, 2026: clean cache holds through 7 stages, but 9 stages is gated off

After the first version of this writeup, I ran a forensic pass on the long horizon failure because the drop looked too sharp to trust at face value. The original `C = 0.20` result did reproduce, but it was not the cleanest interpretation of latent communication.

The old latent path was accidentally building a messy KV cache. At every stage it appended planner system text, the full task prompt, the stage line, and then latent steps. By coder decode on a 7 stage task, the cache contained many near duplicate copies of the full task. The original result therefore mixed two things: text versus latent communication, and clean context versus duplicated or polluted latent cache.

The direct ablation made that visible.

| Variant | Runs | Final pass | Median cache length | Readout |
|---|---:|---:|---:|---|
| Old latent path, exact reproduction | 15 | 3/15 = 0.20 | 2828 | Collapse reproduced |
| Deduplicated latent cache | 15 | 11/15 = 0.73 | 532 | Clean cache recovered most of the drop |
| Text multi agent baseline | 15 | 12/15 = 0.80 | 0 | Text still held slightly better |

The clean cache latent version beat the old latent path by `+0.533` final pass rate (`p = 0.0092`) and was statistically close to the text baseline while still using zero decoded coordination tokens. The better interpretation is:

> The 7 step failure was mostly a cache construction problem, not proof that latent coordination intrinsically fails at 7 stages.

The repair path also taught a useful lesson. It is good at fixing concrete runtime crashes, such as missing imports or serialization errors. It is much weaker when the generated Python is valid but has already chosen the wrong scorer contract or formula. That matters because many long horizon failures were semantic contract misses, not empty code.

I also tested whether the latent steps themselves were clearly doing useful work. The answer is cautious.

| Variant | Runs | Final pass | Readout |
|---|---:|---:|---|
| Deduplicated latent cache | 30 | 25/30 = 0.83 | Best clean latent path |
| No latent step | 30 | 19/30 = 0.63 | Directionally worse, not confirmed |
| Greedy anchor text | 30 | 17/30 = 0.57 | Anchors harmed |

The deduplicated latent path stayed directionally better than the no latent step version, but the pooled test did not confirm the latent step contribution at this sample size (`p = 0.1432`). The greedy anchor variant significantly harmed performance versus clean latent (`p = 0.0470`). In the artifacts, those tiny decoded anchors often parroted or truncated stage text; in one orders task they injected the wrong revenue formula. So this is not a general argument against grounding. It only says this particular greedy anchor implementation polluted the cache.

The cache story also showed a dose response among latent step variants.

| Variant | Latent steps? | Median cache length | Final pass |
|---|---|---:|---:|
| Deduplicated latent cache | yes | 532 | 0.83 |
| Greedy anchor text | yes | 1258 | 0.57 |
| Old latent path | yes | 2828 | 0.20 |
| No latent step | no | 504 | 0.63 |

The dose response is strongest among variants that actually use latent steps. The no latent step variant sits off the curve: short cache, but lower accuracy than clean latent. So duplicated text drives much of the harm, while cache composition and latent updates still matter.

I then tried to push the horizon from 7 stages to 9 stages. That stopped at the control gate. The pre registered rule was that the single agent had to pass at least `13/15` before any B versus C comparison could be interpreted. The final bounded re authoring pass ran on a Tesla T4 after the P100 guard correctly rejected an earlier Kaggle assignment before any rows.

| Xlong gate | Rows | Result | Decision |
|---|---:|---|---|
| P100 guard check | 0 | Not run | Kaggle assigned P100, so the GPU guard stopped before model or rows |
| Final A only re authoring pass | 15 | A single = 9/15 final, 7/15 first attempt | A gate failed; B/C not run |

The family split was uneven: campaign passed `5/5`, orders passed `2/5`, and sensor passed `2/5`. Per the hard rule, I did not run the text or latent xlong matrix, did not launch the 11 stage branch, and did not tune again. The 9 stage result is therefore not evidence that clean cache latent tracks text at 9 stages, and not evidence that it collapses against text at 9 stages. The binding constraint is benchmark construction and model capability at 9 stages, not the coordination channel.

So the current claim is narrower and cleaner:

- Short and medium are still the clean positive result from the original post.
- The scary 7 stage `C = 0.20` collapse was mostly duplicated prompt and cache pollution.
- With a clean cache, training free latent communication is competitive with text through the measured 7 stage planning horizon.
- The latent vector contribution is promising but not proven on its own yet.
- The 9 stage xlong question is closed for this phase because the single agent control did not qualify.

The next real test should be a per stage `execute -> observe -> continue` benchmark, where latent state has to survive many tool boundaries. A trained RecursiveMAS style latent module only becomes meaningful after that benchmark shows exactly what the latent vectors need to carry.

In other words:

> Clean cache latent communication can be competitive through the measured 7 stage planning horizon, but cache construction is a first order design variable. The 9 stage result is not a coordination channel result; it is a benchmark and model capability gate failure.

## References

- RecursiveMAS, training latent cross trajectory links. [recursivemas.github.io](https://recursivemas.github.io/)
- Robin: a closed loop discovery agent. Nature, 2026. [nature.com](https://www.nature.com/articles/s41586-026-10652-y)
- Towards an AI co-scientist. Google, 2025. [arXiv:2502.18864](https://arxiv.org/abs/2502.18864)
- ScienceAgentBench. [arXiv:2410.05080](https://arxiv.org/abs/2410.05080)
