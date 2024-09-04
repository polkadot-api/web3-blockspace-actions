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
      for (const file of files) {
        if (file.name.endsWith(".json")) {
          const fileUrl = file.download_url
          console.log(`Downloading ${file.name} from ${fileUrl}`)

          const fileResponse = await fetch(fileUrl)

          if (fileResponse.ok) {
            const fileData = await fileResponse.text()
            fs.writeFileSync(
              destinationDir +
                file.name.split(".")[0].split(" ").join("-") +
                ".ts",
              "export default " + fileData,
            )
          } else {
            console.error(`Failed to download ${file.name}`)
          }
        }
      }
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
