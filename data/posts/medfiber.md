Fibre segmentation has a data problem. To train a model that can pull apart dense, intertwined fibres in a 3D volume, you need volumes where every voxel is already labelled as the right fibre. Those labels barely exist. Hand labelling a single dense 3D volume is slow, error prone, and does not scale, so the models that need this data the most are the ones starved of it.

MedFiber takes the problem from the other side. Instead of hunting for labelled scans, I generate them. The goal is to replicate fibres faithfully enough that a model trained on the synthetic data learns the real thing, with perfect ground truth for free because the generator knows where every fibre is.

## How the data is made

I grow dense, intertwined, non intersecting fibre structures using Blender physics, then convert them into grayscale microscopy style volumes. Because the geometry is authored, the voxel level labels come out exact: every fibre, every boundary, every contact region is known before a single model sees it.

The detail that matters is replicating the conditions a real instrument would produce. Fibres touch, cross, and crowd, and the hard cases for a segmenter are exactly the contact regions and boundaries where two fibres meet. The generator reproduces those situations on purpose, so the synthetic volumes are difficult in the same way real ones are, not just clean toy shapes.

## Measuring it honestly

A synthetic pipeline is only useful if you can show the segmentation is actually right. I validate predictions against the known ground truth with a spread of metrics rather than a single number:

- Dice and IoU for overlap,
- ARI for clustering agreement,
- object level F1 for whether individual fibres are found,
- variation of information for split and merge errors.

I also built 3D inspection tooling, because the failures that matter most are split and merge mistakes, where one fibre is cut in two or two are fused into one. Seeing those in 3D cut debugging time a lot, since a number alone does not tell you which fibre broke or where.

## Why replicate instead of collect

The bet behind MedFiber is simple. If the synthetic fibres are close enough to real ones, a model can learn segmentation from data that never required a human to label anything. The synthetic set can also be scaled and varied far past what manual labelling allows, which is what lets a production grade fibre segmenter exist at all.

This is an ongoing project. The work so far is the generator, the metric suite, and the inspection tooling. The code is on [GitHub](https://github.com/HaardhikK/MedFiber).
