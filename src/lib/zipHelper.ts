import JSZip from "jszip";
import { saveAs } from "file-saver";
import { VSCodeFile } from "../types";

/**
 * Recursively traverse the VSCodeFile tree nodes and package them inside the JSZip instance.
 * Supports arbitrary folder depth, handling empty directories and text files safely.
 */
function addNodeToZip(nodes: VSCodeFile[], currentZip: JSZip) {
  for (const node of nodes) {
    if (node.type === "file") {
      // Append the file and its current in-memory content to the ZIP directory layer
      currentZip.file(node.name, node.content || "");
    } else if (node.type === "folder") {
      // Create/Access the subfolder inside the active ZIP context
      const folderZip = currentZip.folder(node.name);
      if (node.children && node.children.length > 0) {
        addNodeToZip(node.children, folderZip || currentZip);
      }
    }
  }
}

/**
 * Generates and downloads a ZIP package representing the active file tree.
 * Prints visual status logs inside the terminal workspace.
 */
export async function downloadProjectAsZip(files: VSCodeFile[]): Promise<boolean> {
  try {
    const zip = new JSZip();
    addNodeToZip(files, zip);

    // Generate the blob asynchronously using DEFLATE compression to ensure small binaries
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6, // Optimized balance between browser speed and compression density
      },
    });

    // Save using file-saver
    saveAs(blob, "flutter_vscode_project.zip");
    return true;
  } catch (error) {
    console.error("Failed to compile and zip Workspace files:", error);
    return false;
  }
}
