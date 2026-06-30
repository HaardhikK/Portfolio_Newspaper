A robot that grasps an object needs a 3D model of it. Cameras give that model quickly, and learned reconstruction has become good at producing a full shape from a few images. Touch has been added to this for years, the 2021 Active 3D Shape Reconstruction work being one of the clearest examples, and there is a steady line of vision and touch reconstruction since, from TouchSDF and NeuralFeels to recent diffusion based methods like TouchAnything and Touch2Shape. GelSLAM even shows that touch alone can rebuild a whole object with submillimetre detail. So the question of how to fuse vision and touch into one shape is not open. It has been answered several times, and well.

What these methods share is the target they optimise. They are scored on how close the reconstructed surface is to the true surface, usually by Chamfer distance or a similar average over the whole object. That is a sensible target if the goal is a faithful shape. It is the wrong target if the goal is to grasp.

## The gap I want to work on

A reconstruction can score very well on average shape and still be wrong in the few places that decide a grasp. The underside of an object, the small patch under a finger, a thin lip, a rounded edge. These are often where vision is least sure, because they are hidden or seen at a grazing angle, and they are exactly where the hand makes contact. An average shape score hides this, since the large correct majority of the surface drowns out the small wrong region that actually matters.

So the gap is not to combine vision and touch. It is to judge and fix a reconstruction by how it behaves under contact, not by how it looks. As far as I have found, no vision and touch reconstruction work is scored this way, including the active touch part of that 2021 paper, which chooses touches to lower Chamfer distance rather than to fix contact behaviour. One recent paper does ask whether single view reconstruction is good enough for robotics and scores it by grasp success instead of shape error, which is the right instinct, but it stays vision only and does not bring in touch.

## The idea, and how speculative decoding fits

The link to speculative decoding is the shape of the method. In speculative decoding a small cheap model drafts the next tokens and a large expensive model only checks them, so you pay for the expensive model far less often while ending up with the same output.

I want to run the same loop, but with physical cost in place of compute cost. Vision is the cheap draft. It proposes the whole object in one shot. A touch is the expensive check, slow and one small patch at a time. So I would not touch everywhere. I would touch only to check the parts of the draft that are most likely wrong and most likely to be gripped, keep the draft where the touch agrees with it, and fix it where the touch does not. The thing being saved is the number of touches, the same way speculative decoding saves expensive model calls.

This turns into two concrete rules to design, which is where most of the research sits:

1. an accept or reject test, that compares a touch against the draft at that spot and decides whether the draft was already good enough for contact there,
2. a rule for where to touch next, that spends the limited touches where a reject is most likely and where the object is most likely to be held.

Neither rule exists in this form today. Active touch in the older sense picks the touch that most lowers average shape error. Here a touch is a check with a pass or fail outcome, and its value is measured in contact behaviour, not in Chamfer distance.

## What the draft is stored as

The loop also settles one choice that matters more than it first looks: what the draft is stored as. The loop wants something cheap to produce and ready to test the moment it exists.

Most strong reconstructions today produce Gaussians or a neural field. To press on those in a physics engine you first convert them into a mesh, and that conversion is slow and rounds off the fine edges and thin parts, which are the very places a grasp depends on. A reconstruction that already outputs a triangle mesh avoids this. The draft goes straight into the simulator and is pressed as is, and when a touch rejects a region I can move the few vertices there without rebuilding anything. Recent feed forward methods like TriSplat produce such a simulation ready mesh in a single pass, in seconds, while diffusion based methods spend over an hour per object.

## The goal

Reach a model that is right under contact with as few touches as possible, and be able to say clearly where it is right. Right under contact means three things that can be measured when the object is pressed in simulation:

1. the contact area matches the real one,
2. the two surfaces meet at the correct depth, rather than passing through each other or floating apart,
3. the contact forces are close to the real object's.

These are the numbers I would improve and report, in place of average shape error.

## How it would be evaluated

The main result is one curve. Number of touches on one axis, how right the model is under contact on the other. On that curve I would compare four things: vision alone with no touches, touches placed at random, touches placed to lower average shape error, and touches placed by the accept or reject test and the selection rule. If the idea holds, the last reaches good contact behaviour with clearly fewer touches than the rest.

Before any of that, one early test decides whether the direction is worth taking. I would take reconstructions that already have a good average shape score and check whether they still behave badly under contact. If they do, the gap is real. If a good shape score already promises good contact behaviour, I would change direction early rather than after building everything.

## References

1. Smith et al. (incl. R. Calandra). Active 3D Shape Reconstruction from Vision and Touch. NeurIPS 2021. [arXiv:2107.09584](https://arxiv.org/abs/2107.09584)
2. GelSLAM: tactile only 3D SLAM, 2025. [arXiv:2508.15990](https://arxiv.org/abs/2508.15990)
3. TouchAnything: reconstruction from sparse touches with a diffusion prior, 2026. [arXiv:2604.08945](https://arxiv.org/abs/2604.08945)
4. Touch2Shape: touch conditioned diffusion reconstruction. CVPR 2025. [arXiv:2505.13091](https://arxiv.org/abs/2505.13091)
5. TriSplat: feed forward reconstruction with a simulation ready mesh, 2026. [arXiv:2605.26115](https://arxiv.org/abs/2605.26115)
6. Speculative Speculative Decoding, 2026. [arXiv:2603.03251](https://arxiv.org/abs/2603.03251)
7. Is Single View Mesh Reconstruction Ready for Robotics, 2025. [arXiv:2505.17966](https://arxiv.org/abs/2505.17966)
