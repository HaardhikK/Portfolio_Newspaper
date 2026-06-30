I propose Exogenous Sensorimotor Imprint, or Imprint for short, as a complementary intrinsic principle for task agnostic agency. Empowerment asks how much future sensory variation an agent can make selectable through its own action channel. Homeostasis asks whether the agent's internal variables stay within viable bounds. Imprint asks a third question: after the agent's current policy and action interface have been accounted for, how much of its predicted future sensory trajectory is still being shaped by structured dynamics that the agent is not presently selecting through its own actions?

A note on the term. Imprint here does not mean developmental imprinting in ethology, and it does not mean representation imprinting in machine learning. The direction is the point. The agent is not imprinting the world. A source in the world is imprinting the agent's future sensory experience.

## The principle

The central hypothesis is that autonomy is not fully captured by asking only how many future states the agent can choose between. An agent may keep local control while part of its future sensory stream is being written by structured exogenous dynamics. Conversely, an agent may have low empowerment without being strongly imprinted if neither it nor the environment is generating meaningful future differentiation. Imprint is not the inverse of empowerment. It is an attribution signal: it identifies the portion of future sensory structure predicted to arise from persistent, predictive, action weak sources rather than from the agent's own policy selectable action channel.

What is new is not an information theoretic quantity but a synthesis stated in a specific direction. The contribution is to treat exogenous, structured, action weak dynamics as a first class signal worth tracking rather than as noise to filter out, qualified by a single filter that excludes random noise, static structure, and agent controllable variables at once, and read alongside empowerment and homeostasis rather than optimised on its own.

## Formal definition

Let $B_t$ denote the agent's belief state at time $t$, summarising its sensorimotor history. Let $A_t$ denote the action, $O_t$ the observation, and $\pi$ the current policy. Let $O_{t+1:t+n}$ denote the future observation sequence over horizon $n$. Let $Z^k_t$ denote a candidate latent source in the agent's learned world model. The source $Z^k$ is not assumed to be a true world state. It is an inferred component of the agent's model that may explain part of future sensory structure.

A candidate source $Z^k$ is PPA qualified when it satisfies three conditions: Persistence, Predictive influence, and Action weakness.

**Persistence** means coherent generative forward dynamics over the horizon, rather than one step noise. A possible score is

$$P_n^k(t) = I\left(Z_t^k ; Z_{t+1:t+n}^k \mid B_t\right).$$

**Predictive influence** means the source contributes to predicting future observations under the current policy. A possible directed influence score is

$$F_n^{k,\pi}(t) = I\left(Z_{t:t+n-1}^k \rightarrow O_{t+1:t+n} \,\Vert\, B_t,\pi\right),$$

where $\rightarrow$ denotes directed information and $\Vert\, B_t,\pi$ denotes causal conditioning on the belief state and current policy.

**Action weakness** means the future of the source is weakly responsive to the agent's actions compared with how strongly it shapes observations. A possible score is

$$R_n^{k,\pi}(t) = I\left(A_{t:t+n-1} \rightarrow Z_{t+1:t+n}^k \,\Vert\, B_t,\pi\right).$$

The source is PPA qualified when

$$P_n^k(t) > \tau_P, \qquad F_n^{k,\pi}(t) > \tau_F,$$

$$R_n^{k,\pi}(t) \leq \lambda\, F_n^{k,\pi}(t), \quad 0 < \lambda < 1.$$

Here $\tau_P$, $\tau_F$, and $\lambda$ are not universal constants. They are horizon, sensor, actuator, and model dependent calibration terms. White noise fails Persistence, a static object fails Predictive influence, and an agent controllable variable fails Action weakness. Because Action weakness is the comparative ratio $R_n^{k,\pi} \leq \lambda F_n^{k,\pi}$, it is embodiment relative rather than an absolute threshold.

## The Imprint quantity

The ideal semantic definition is the unique policy exogenous predictive contribution of PPA qualified sources to future observations:

$$\mathrm{Imp}_n^\pi(t) = \sum_{k \in \mathcal{Z}_{PPA}} U_{Z^k}\!\left(O_{t+1:t+n};\, Z_{t:t+n-1}^k \mid B_t,\pi\right),$$

where $U_{Z^k}$ is the unique predictive contribution of source $Z^k$, excluding information redundant with the action channel or with other sources. This connects Imprint to partial information decomposition.

Because full decomposition is hard to estimate in general, a simpler operational proxy is the source ablation form:

$$\widetilde{\mathrm{Imp}}_n^\pi(t) = \sum_{k \in \mathcal{Z}_{PPA}} D_{KL}\!\left[\, p(O_{t+1:t+n}\mid B_t,\pi)\ \Vert\ p^{-k}(O_{t+1:t+n}\mid B_t,\pi)\,\right],$$

where $p^{-k}$ is the predicted future when the autonomous forward dynamics of source $Z^k$ are clamped, frozen, or marginalised out. This measures how much the predicted future sensorium depends on that source's own dynamics. It presupposes a world model that factors the predicted observation process into separable per source forward dynamics, which is the open problem the theory still rests on.

This proxy avoids a trap in a naive conditional mutual information definition such as

$$I\left(Z_t^k ; O_{t+1} \mid B_t,A_t\right).$$

If the belief state already contains a complete representation of a predictable source, this can collapse even though the source keeps determining the future. Knowing a conveyor belt is moving east does not mean the agent controls it. Imprint should measure the dependence of the future trajectory on the conveyor's autonomous dynamics, not merely the uncertainty reduction from observing its current state.

## Four regimes

- **High empowerment, low Imprint:** autonomous leverage. Many futures are available and mostly selectable by the agent.
- **Low empowerment, low Imprint:** dormancy. Little meaningful future differentiation from either side.
- **Low empowerment, high Imprint:** exposure or capture. The future changes in a structured way, but the source is not the agent.
- **High empowerment, high Imprint:** coupled agency. The world strongly shapes the future, but the agent still has enough local choice to exploit, resist, or redirect it.

## A few sharpening examples

- **A drifting gridworld.** Two worlds with the same local action set. In one the floor is static. In the other, every action also shifts the agent one cell east, like a conveyor. Empowerment may look similar, but the second has a persistent, predictive, action weak drift. Imprint captures that missing attribution.
- **A warehouse robot on an autonomous platform.** It can still turn its camera and move its arm, so empowerment is not zero, yet the sequence of scenes it meets is set by a route chosen elsewhere.
- **A glider on a thermal.** The trajectory is strongly shaped by the environment while the agent keeps real steering ability. Empowerment and Imprint can both be high, which is why the theory does not treat all external structure as a threat.
- **A predictable conveyor versus curiosity.** The conveyor produces low novelty and low prediction error, so curiosity is low, yet Imprint stays high because the future still depends on the conveyor's own dynamics. Curiosity asks what the agent can learn. Imprint asks what is shaping its future despite its action interface.

## Positioning

The nearest prior art is the exogenous state literature in reinforcement learning. Work on exogenous state variables, Denoised MDPs, and the Exogenous Block MDP all separate endogenous from exogenous structure and then discard the exogenous part as a nuisance. Imprint inverts the value sign: the action weak, structured, exogenous component is exactly the signal of interest, and it stays meaningful even when it is reward irrelevant and perfectly predictable. That same machinery, multistep inverse dynamics in particular, is also the most credible route to the per source forward dynamics the ablation measure needs.

It is also close to the information theoretic account of autonomy and individuality, so the theory must pre empt the objection that it is merely one minus autonomy. The differences are concrete: Imprint qualifies sources through the PPA filter rather than scoring the whole system, conditions on a fixed current policy, is defined by source ablation on forward dynamics, is descriptive rather than normative, and is defined over the sensory stream rather than whole system self determination.

## Limitations

Imprint is not a new information theoretic object. Its ingredients are conditional mutual information, transfer entropy, directed information, source ablation, and partial information decomposition. The novelty is the source qualified, agent centric framing. It also depends on the quality of the agent's learned world model, can be hard to separate from merely unobserved action influence under partial observability, and is not a standalone objective, since minimising it alone could encourage isolation or rejection of useful guidance. These define its proper scope rather than defeating it.

In one sentence: Imprint measures how much of an agent's predicted future sensorium is being written by persistent, predictive dynamics that shape the agent more strongly than the agent can shape them.

## References

- Bertschinger, Olbrich, Ay, Jost (2008). Autonomy: an information theoretic perspective. BioSystems 91(2), 331 to 345.
- Bertschinger, Rauh, Olbrich, Jost, Ay (2014). Quantifying unique information. Entropy 16(4), 2161 to 2183.
- Dietterich, Trimponias, Chen (2018). Discovering and removing exogenous state variables and rewards for RL. ICML. [arXiv:1806.01584](https://arxiv.org/abs/1806.01584)
- Efroni, Misra, Krishnamurthy, Agarwal, Langford (2022). Provable RL with exogenous distractors via multistep inverse dynamics. ICLR. [arXiv:2110.08847](https://arxiv.org/abs/2110.08847)
- Everitt, Carey, Langlois, Ortega, Legg (2021). Agent incentives: a causal perspective. AAAI. [arXiv:2102.01685](https://arxiv.org/abs/2102.01685)
- Friston (2010). The free energy principle: a unified brain theory? Nature Reviews Neuroscience 11(2), 127 to 138.
- Klyubin, Polani, Nehaniv (2005). Empowerment: a universal agent centric measure of control. IEEE CEC.
- Krakauer, Bertschinger, Olbrich, Flack, Ay (2020). The information theory of individuality. Theory in Biosciences 139(2), 209 to 223. [arXiv:1412.2447](https://arxiv.org/abs/1412.2447)
- Levine, Stone, Zhang (2025). Learning a fast mixing exogenous block MDP using a single trajectory. ICLR. [arXiv:2410.03016](https://arxiv.org/abs/2410.03016)
- Wang, Du, Torralba, Isola, Zhang, Tian (2022). Denoised MDPs. ICML. [arXiv:2206.15477](https://arxiv.org/abs/2206.15477)
- Williams, Beer (2010). Nonnegative decomposition of multivariate information. [arXiv:1004.2515](https://arxiv.org/abs/1004.2515)
