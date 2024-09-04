console.log("Loading delegates...")
import fs from "fs"

const destinationDir = "./src/actions/delegate/registry/"

const fetchJSONFiles = async () => {
  const owner = "novasamatech"
  const repo = "opengov-delegate-registry"
  const branch = "master"
  const folderPath = "registry"

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
      },
    })

    if (response.ok) {
      const files = await response.json()
      console.log("files", files)

      let indexFile = ""
      for (const file of files) {
        if (file.name.endsWith(".json")) {
          const fileUrl = file.download_url
          console.log(`Downloading ${file.name} from ${fileUrl}`)

          const fileResponse = await fetch(fileUrl)

          const fileName = file.name.split(".")[0].split(" ").join("-")
          if (fileResponse.ok) {
            const fileData = await fileResponse.text()
            fs.writeFileSync(
              destinationDir + fileName + ".ts",
              "export default " + fileData,
            )
            indexFile += `export * as ${snakeToCamel(fileName)} from "./${fileName}" \n`
          } else {
            console.error(`Failed to download ${file.name}`)
          }
        }
      }
      fs.writeFileSync(destinationDir + "index.ts", indexFile)
    } else {
      console.error(
        `Failed to get contents of the folder. Status code: ${response.status}`,
      )
    }
  } catch (error) {
    console.error("Error fetching JSON files:", error)
  }
}

fetchJSONFiles()

function snakeToCamel(snakeStr: string): string {
  return snakeStr
    .toLowerCase() // Ensure the string is in lowercase
    .replace(/-./g, (match) => match.charAt(1).toUpperCase()) // Convert each _x to X
}
