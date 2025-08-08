import ollama from 'ollama'

const response = await ollama.chat({
  model: 'phi4',
  messages: [{ role: 'user', content: 'Why is the sky blue?' }],
  stream: true
})
for await (const part of response) {
  process.stdout.write(part.message.content)
}