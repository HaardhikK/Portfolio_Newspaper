Arthantar was my bachelor thesis, but the point was not just to build another translation pipeline. The bet was that a smaller model could do the work of a much larger one if the system around it made the hard context explicit first. Instead of scaling the model, retraining it, or hoping it would infer everything from the raw sentence, Arthantar tries to give it the missing structure before translation begins.

That mattered to me because bigger models are an expensive default answer. They cost more to run, they need more compute to improve, and they are not always necessary. A cleaner framework can sometimes make a smaller, apparently weaker model behave like a stronger one. Arthantar was built around that idea: better architecture first, bigger model later only if it is actually needed.

The sentence first goes through coreference resolution. FCoref identifies pronouns, links them back to the entities they refer to, and extracts gender where the sentence gives enough evidence. When that step cannot settle the gender or entity information cleanly, an LLM based fallback reads the name, role, and surrounding clues to fill in what the coreference module missed.

<figure class="post-figure">
  <img src="assets/arthantar-architecture.svg" alt="Arthantar pipeline: a source sentence passes through coreference resolution, an LLM fallback when needed, knowledge graph generation, and translation with graph metadata.">
  <figcaption>The pipeline. Coreference first, fallback gender inference when needed, then a knowledge graph whose metadata is passed with the original sentence to the translation model.</figcaption>
</figure>

## Building context before translation

After coreference and fallback gender inference, Arthantar feeds the original sentence and the resolved metadata into a knowledge graph stage. The LLMGraphTransformer builds a graph of entities, relationships, and gender information. The graph is not meant to be decorative. It is a compact memory of the context a translation model often has to reconstruct on its own.

This changes the translation task. The small model no longer receives only a sentence and a hope. It receives the sentence, the resolved references, the gender information, and a graph of how the entities relate to one another. The model can spend its capacity on translation instead of wasting it rediscovering who "she", "he", or a named person refers to.

## Fallbacks over fragile cleverness

A system like this only helps if it keeps working when one component is uncertain. Arthantar uses a multi level fallback design for that reason. If the coreference stage is not enough, an LLM based gender backup tries to infer the missing entity details. If graph generation fails, the system falls back to a simpler graph built from spaCy parsing, named entities, NetworkX relationships, and finally basic capitalized entity extraction.

The important part is not that every fallback is equally smart. They are not. The important part is that the translation model still receives some structured context instead of nothing. That makes the pipeline more stable and keeps inference practical even when one stage behaves badly.

## Why the smaller model mattered

The final translation model was a smaller Llama 3.1 8B setup, fine tuned with DeepSpeed, reading the graph metadata alongside the original sentence. The goal was to show that better scaffolding can close part of the gap between small and large models without retraining the whole system from scratch.

That is the core idea of Arthantar: do not make the model bigger just because the task is hard. First ask what the model is missing. In hard translation, it often misses explicit context: pronoun links, gender cues, entity relationships, and the structure of the sentence. If those are computed once and handed over cleanly, a smaller model can compete with larger ones that are left to infer everything internally.

This is also the sustainability argument. Efficient AI is not only about compression after the fact. It can also come from designing the right framework around a smaller model, so fewer parameters and less retraining still produce useful results. Arthantar was my attempt to make that argument concrete in multilingual translation.

## What I would change

The graph is only as good as the extraction, and the fallback chain is dependable but still blunt. A better version would let the translator question the graph during translation and ask for corrections when the metadata looks inconsistent. That would make the framework less like a fixed preprocessing pipeline and more like a small reasoning loop around the model. The code is on [GitHub](https://github.com/HaardhikK/Arthantar).
