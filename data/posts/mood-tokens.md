Language models can be trained to use low content tokens as a control stream for hidden computation, in the way music modulates human cognition without directly encoding task information. My central claim is that a small family of special tokens can steer not only how much a language model thinks, but how it thinks, generalizing the mechanism behind pause token gains from "more compute" to "different computation."

Rather than treating pause or filler tokens as placeholders, I frame them as a low dimensional neuromodulatory interface: a trainable vocabulary that shifts the model into distinct computational regimes, deliberate, exploratory, concise, or safe, without altering its weights or task labels. This differs from prefix tuning or CTRL style control codes, which optimise tokens to maximise task performance. Mood tokens are trained to be task agnostic but process shaping: the test is whether they transfer across tasks and induce consistent hidden state shifts regardless of input content.

## What "different computation" means

I define it operationally as measurably different internal routing for the same input, not just different outputs. Two control tokens produce genuinely different computation only if they induce distinct hidden state trajectories (measurable with probing classifiers), distinct attention entropy profiles across layers, and causal evidence that swapping tokens changes which layers perform which function, not merely output length. If two tokens produce identical hidden state trajectories but different outputs, that is different decoding, not different computation.

The interpretability claim lives or dies on training signal design. If mood tokens are trained against behaviours that can be labelled and audited, for example `<safe>` trained against refusal rate and calibration targets, the opacity of hidden computation becomes structured and inspectable. Trained end to end purely for performance, the result is a better black box. This tension is a central design choice, not a footnote.

## Background

Goyal et al. (2024) show that a decoder only model trained with learnable pauses appended to the prefix, with output extraction delayed until the last pause, improves on SQuAD, CommonSenseQA, and GSM8K at 1B scale. Delayed next token prediction changes compute allocation, not just latency. Pfau et al. (2024) show that meaningless filler tokens can carry hidden intermediate computation on algorithmic tasks, so semantically empty tokens can serve as a computational substrate. London and Kanade (2025) prove that pause tokens strictly increase the expressivity of constant depth Transformers.

The Pfau et al. finding raises the sharpest tension: hidden filler computation is already happening and already opaque. This idea does not make hidden computation go away. It asks whether that opacity can be made intentional, structured, and steerable.

## Related work

The broader motivation is the "music for AI agents" idea: an external low bandwidth stream that modulates internal state without encoding task information. Reinforcement learning analogues include intrinsic motivation, homeostatic drives, and affect like control variables that reshape exploration, persistence, and risk sensitivity without changing the task label.

Most directly, Lindsey et al. (2026) show that abstract internal emotion concept representations causally shift model behaviour, where "desperate" versus "calm" steering vectors dramatically alter reward hacking rates. That is direct evidence that low dimensional affective controls can modulate computational style without altering task labels. The gap is that none of these lines develops a general, intentionally designed control vocabulary for computational style. Pause tokens are treated as compute extenders, filler tokens as accidental reasoning aids, steering vectors as post hoc interventions. I want to train a structured family of tokens that fills this role on purpose, from the start.

## Proposed mechanism

**Token design.** A decoder only model is trained with a small, learnable set of control tokens prepended to the input. The simplest version uses discrete tokens such as `<safe>`, `<explore>`, `<fast>`, and `<deliberate>`. A more expressive version uses token sequences as trajectories through a latent mood space. The critical constraint: these tokens must not correspond to task content. They modulate processing, they do not carry semantic information about the task.

**Training signal.** Without a signal that differentiates mood tokens from each other, they collapse into the same generic pause behaviour. So the objective includes mode specific supervision: each token is trained against a distinct behavioural target, for example calibration and refusal rate for `<safe>`, answer entropy and solution diversity for `<explore>`, token budget adherence for `<fast>`. The main next token prediction objective is preserved; mood tokens are an extra conditioning layer.

**Controller.** A lightweight external controller selects control tokens based on task metadata or uncertainty signals, like a DJ choosing a track. It picks the computational mode without changing model weights, which keeps the system modular. The controller is the last component to build, since it is only meaningful once mood tokens are shown to produce genuinely distinct internal regimes.

## Experiments

1. **Probing hidden states (primary).** Train linear probes on hidden states under each mood token, evaluated on held out tasks. Success requires hidden state clusters that separate by token identity, not by task type. Causal ablations, swapping tokens mid generation, add evidence. This experiment can falsify the central claim.
2. **Generic pause versus mood pause.** Compare baseline, generic pause, and mood specific tokens on reasoning, QA, and instruction following. The key metric is controllability, whether mood tokens produce reliably distinct behavioural profiles, not aggregate accuracy.
3. **Hidden computation on synthetic tasks.** Following Pfau et al., test whether different filler patterns induce different internal solving strategies while preserving correctness.
4. **Cross task transfer.** Test whether mood tokens transfer across domains, difficulty, prompt styles, and input lengths. This is the key separation from prefix tuning, whose tokens should be task specific.
5. **Controller driven scheduling.** Contingent on the first four, introduce a controller trained with preference feedback to select tokens dynamically, and test whether dynamic scheduling beats static choices.

## Open questions

These are genuine open problems, not rhetorical ones:

- **Collapse risk.** Will mood tokens collapse without a sufficiently diverse, mode specific training signal?
- **Manifold claim.** The mood space is asserted to be low dimensional and smooth, but that needs empirical verification.
- **Robustness.** Does control persist under adversarial prompting or fine tuning?
- **Control versus opacity.** Does making hidden computation intentional make it more interpretable, or just shift who controls the opacity? The answer depends entirely on training signal design.

## References

- Goyal et al. (2024). Think before you speak: Training Language Models With Pause Tokens. ICLR 2024. [arXiv:2310.02226](https://arxiv.org/abs/2310.02226)
- Pfau et al. (2024). Let's Think Dot by Dot: Hidden Computation in Transformer Language Models. [arXiv:2404.15758](https://arxiv.org/abs/2404.15758)
- London and Kanade (2025). Pause Tokens Strictly Increase the Expressivity of Constant Depth Transformers. [arXiv:2505.21024](https://arxiv.org/abs/2505.21024)
- Han et al. (2025). Token Budget Aware LLM Reasoning. [arXiv:2412.18547](https://arxiv.org/abs/2412.18547)
- Kim et al. (2025). Learning to Insert [PAUSE] Tokens for Better Reasoning. [arXiv:2506.03616](https://arxiv.org/abs/2506.03616)
- Lindsey et al. (2026). Emotion Concepts and their Function in a Large Language Model. Anthropic, Transformer Circuits.
- Li and Liang (2021). Prefix Tuning: Optimizing Continuous Prompts for Generation. ACL 2021.
- Keskar et al. (2019). CTRL: A Conditional Transformer Language Model for Controllable Generation. [arXiv:1909.05858](https://arxiv.org/abs/1909.05858)
