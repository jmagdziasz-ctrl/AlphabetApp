// Uses DeepAI's Toonify API — free tier, no credit card required
// Get a free key at: deepai.org → sign up → API Keys

export async function cartoonifyFace(
  imageUri: string,
  apiKey: string
): Promise<string> {
  // Build multipart form with the image file
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'face.jpg',
  } as any);

  const response = await fetch('https://api.deepai.org/api/toonify', {
    method: 'POST',
    headers: { 'api-key': apiKey },
    body: formData,
  });

  if (response.status === 401) {
    throw new Error('Invalid API key. Sign up free at deepai.org and copy your API key from the dashboard.');
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`DeepAI error ${response.status}: ${body}`);
  }

  const result = await response.json();

  if (result?.err) {
    throw new Error(`DeepAI: ${result.err}`);
  }

  if (!result?.output_url) {
    throw new Error(`No output from DeepAI: ${JSON.stringify(result)}`);
  }

  return result.output_url as string;
}
