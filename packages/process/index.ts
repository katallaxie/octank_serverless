export async function main(event) {
  console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`)

  let output = {}

  try {
    const { detail } = event
    output = { ...detail }
  } catch (e) {
    throw e
  }

  return { ...output }
}
