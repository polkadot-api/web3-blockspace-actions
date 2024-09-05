console.log("Loading delegates...")
import fs from "fs"

const destinationDir = "./src/actions/delegate/registry/"
const disclaimer =
  "//** This file is autogenerated (see scripts/update-delegates.ts). Please do not edit manually. **\n\n"

const excludedFiles = [
  "bifrost kusama.json",
  "governance2 novasama testnet.json",
]
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

      let indexFile = disclaimer
      let indexMap = "export const delegateMap = {\n"

      for (const file of files) {
        console.log("excluding", file.name, excludedFiles)
        if (excludedFiles.includes(file.name)) continue
        if (file.name.endsWith(".json")) {
          const fileUrl = file.download_url
          console.log(`Downloading ${file.name} from ${fileUrl}`)

          const fileResponse = await fetch(fileUrl)

          const fileName = file.name.split(".")[0].split(" ").join("-")
          if (fileResponse.ok) {
            const fileData = await fileResponse.text()

            if (fileData.trim() === "[]") continue
            fs.writeFileSync(
              destinationDir + fileName + ".ts",
              disclaimer + "export default " + fileData,
            )
            const variableName = snakeToCamel(fileName)
            indexFile += `import ${variableName} from "./${fileName}" \n`
            indexMap += `\t${variableName},\n`
          } else {
            console.error(`Failed to download ${file.name}`)
          }
        }
      }

      indexMap +=
        "} " + "\n\nexport type SupportedChains = keyof typeof delegateMap"
      fs.writeFileSync(destinationDir + "index.ts", indexFile + "\n" + indexMap)
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
    .toLowerCase()
    .replace(/-./g, (match) => match.charAt(1).toUpperCase())
}