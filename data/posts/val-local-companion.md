<p><strong><a href="https://www.linkedin.com/posts/haardhik-kunder_meet-val-your-own-local-companion-a-tiny-activity-7515464109937737728-5zzm" target="_blank" rel="noopener noreferrer">See Val in motion</a></strong> · <strong><a href="https://github.com/HaardhikK/Val" target="_blank" rel="noopener noreferrer">Open-source code</a></strong></p>

Meet Val, a small local companion that lives on a seven-year-old Android phone. <span class="kaomoji">(ﾉ◕ヮ◕)ﾉ*</span>

No cloud. No Wi-Fi. No SIM. It listens, looks at photos, gives directions, reacts when you move the phone, and talks back. Everything stays on the device.

I wanted to work on robotics and local AI, but a lot of robotics starts with new hardware that most people will never own. An old phone already has a screen, camera, microphone, speaker, battery, GPS, and a pile of sensors. I wanted to see how far I could push all of that before adding anything else.

## What runs on it

Val uses three small local models:

- **Moonshine Base** turns voice into text. Moonshine Tiny is there as a lighter backup.
- **Needle 3** is a 35 MB model I fine-tuned with LoRA. It decides what action you are asking for.
- **LFM2.5-VL-450M** answers open questions and looks at photos through `llama.cpp`.

Simple requests do not need the vision-language model. Rules and the phone's own data handle things like time, battery, location, timers, and fixed commands first. That keeps Val quick and avoids using a model when a normal answer is better.

I also tried larger local text-to-speech models. They sounded nicer, but they took around four to six seconds to start speaking. Android's offline voice starts in about a quarter of a second, so I kept it. Kitten TTS is the fallback. A fast reply felt much better than a nicer voice with a long pause.

Hold the volume-down button and talk. Release it and Val answers. Two presses open the camera, three open the map, and four open the magnetic-field detector. <span class="kaomoji">(˶ᵔ ᵕ ᵔ˶)</span>

## Offline, but still useful

You can take a photo and ask Val what it sees. You can also ask for the nearest hospital and get a walking route without an internet connection.

The map of Dresden lives on the phone, along with local place search, footpaths, and the tram and bus timetable. The timetable is the published schedule, not live delay data, but it works completely offline. Voice, photos, questions, location, and routes never need to leave the device.

## Using the whole phone

The sensors are what make Val feel less like a chat app.

- Tilt the phone and Val slides downhill.
- Flip it and Val falls.
- Shake it or knock on the table and it notices.
- Cover the proximity sensor and it plays peekaboo.
- In the dark it gets sleepy; in bright light it wears sunglasses.
- Bring a fridge magnet close and the magnetometer reacts to the change in the magnetic field.

There are smaller things too: poking Val, carrying it with a long press, flipping a coin, rolling a die, dancing, taking notes, and a few easter eggs. <span class="kaomoji">( ˘▽˘)っ</span>

The hard part was getting all of this to run together on one old Snapdragon 710 with 4 GB of RAM. Speech recognition, the action model, `llama.cpp`, maps, voice, and the animation all want CPU time. I gave the heavier parts small thread budgets, run the chat server at a lower priority, and let it sleep when Val has been idle. The animation also drops to 30 fps when nothing important is moving.

## What I want to try next

I have really been missing NFC on this phone. With NFC, two Val devices could meet with a tap, exchange pairing information, and then talk over Bluetooth or a local connection like a walkie-talkie. I think that would suit the project much better than adding another menu.

The one part I am actively trying to improve is speech recognition in loud rooms. I am looking into lightweight noise suppression and whether MLIR can help compile that preprocessing efficiently enough to keep it running locally on the same phone.

For now, Val lives inside a phone that had been sitting in my drawer for years, which still feels pretty cool. <span class="kaomoji">(｡•̀ᴗ-)✧</span>
