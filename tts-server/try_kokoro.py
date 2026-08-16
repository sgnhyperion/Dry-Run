from kokoro import KPipeline
import soundfile as sf


pipeline = KPipeline(lang_code='a')
text = '''
[Kokoro](/kˈOkəɹO/) is an open-weight TTS model with 82 million parameters. Despite its lightweight architecture, it delivers comparable quality to larger models while being significantly faster and more cost-efficient. With Apache-licensed weights, [Kokoro](/kˈOkəɹO/) can be deployed anywhere from production environments to personal projects.
'''
SAMPLE_RATE = 24000

audio_data = pipeline(text, voice='af_heart')

for i, (graphemes, phonemes, audio) in enumerate(audio_data):
    sf.write(f'output_{i}.wav', audio, SAMPLE_RATE) 