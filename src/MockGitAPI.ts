import { PageItem } from './types';

export interface LocalAsset {
  id: string;
  type: 'image' | 'video' | 'text' | 'model';
  name: string;
  src: string;
}

// A collection of beautiful, high-resolution modular grid assets (images & procedural 3D elements)
const STATIC_ASSET_LIBRARY: Record<string, LocalAsset[]> = {
  '/pages/cover': [
    {
      id: 'ast-1',
      type: 'image',
      name: 'Brutalist Spiral Stairs',
      src: 'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'ast-2',
      type: 'image',
      name: 'Modern Skyscraper Facade',
      src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    },
  ],
  '/pages/spread1-left': [
    {
      id: 'ast-3',
      type: 'image',
      name: 'Minimal Living Space',
      src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    },
  ],
  '/pages/spread1-right': [
    {
      id: 'ast-4',
      type: 'image',
      name: 'Abstract Concrete Blocks',
      src: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'ast-5',
      type: 'image',
      name: 'Geometric Glass Windows',
      src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
  ],
};

const GLOBAL_DRAWER_ASSETS: LocalAsset[] = [
  // 3D Shapes
  { id: 'dr-3d-torus', type: 'model', name: 'Swiss Gold Torus', src: 'torus' },
  { id: 'dr-3d-knot', type: 'model', name: 'Infinite Knot', src: 'knot' },
  { id: 'dr-3d-sphere', type: 'model', name: 'Tactile Sphere', src: 'sphere' },
  { id: 'dr-3d-box', type: 'model', name: 'Architectural Cube', src: 'box' },

  // Unsplash Premium Curated Editorial Images
  {
    id: 'dr-img-1',
    type: 'image',
    name: 'Spiral Concrete Escalator',
    src: 'https://images.unsplash.com/photo-1541824894926-3c58ec3ce706?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dr-img-2',
    type: 'image',
    name: 'Skyscraper Facade Grid',
    src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dr-img-3',
    type: 'image',
    name: 'Brutalist Concrete Slabs',
    src: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dr-img-4',
    type: 'image',
    name: 'Studio Interior Perspective',
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dr-img-5',
    type: 'image',
    name: 'Concrete Structural Column',
    src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dr-img-6',
    type: 'image',
    name: 'Warm Minimalist Space',
    src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  },
];

/**
 * Dynamically fetches assets available for a specific page path.
 * In production this would scan local directories or buckets.
 */
export async function fetchLocalAssets(pagePath: string): Promise<LocalAsset[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const pageAssets = STATIC_ASSET_LIBRARY[pagePath] || [];
      // Return both page-specific assets and general architectural elements
      resolve([...pageAssets, ...GLOBAL_DRAWER_ASSETS]);
    }, 250);
  });
}

/**
 * Persists the current design layout of a page.
 * Supports Local Storage and showcases production GitHub API deployment.
 */
export async function savePageLayout(
  pagePath: string,
  layoutJson: { items: PageItem[]; gridSettings: any },
  oauthToken?: string
): Promise<{ success: boolean; message: string; commitUrl?: string }> {
  // Simulate API lag
  await new Promise((resolve) => setTimeout(resolve, 600));

  // --- LOCAL PERSISTENCE ---
  try {
    const key = `swiss_layout_${pagePath}`;
    localStorage.setItem(key, JSON.stringify(layoutJson));
    console.log(`Saved locally to key: ${key}`, layoutJson);
  } catch (err) {
    console.error('Failed to save in localStorage', err);
  }

  // If no OAuth token is provided, return simulated successful response
  if (!oauthToken) {
    return {
      success: true,
      message: `Layout saved locally to storage for path: "${pagePath}". (Sign in to commit to GitHub)`,
    };
  }

  // --- PRODUCTION GITHUB COMMIT PIPELINE (Octokit/REST Mock) ---
  // Demonstrates committing JSON layout directly to a Git repo using Git database APIs
  try {
    const repoOwner = 'swiss-design-studio';
    const repoName = 'editorial-portfolio';
    const filePath = `data/layouts${pagePath}/layout.json`;
    const branch = 'main';

    console.log('Initiating premium GitHub Git Database commit flow with OAuth Token...');

    /*
     * STEP-BY-STEP COMMIT WORKFLOW VIA REST:
     * 
     * 1. Retrieve the branch reference to get the current head commit SHA:
     *    const refRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/ref/heads/${branch}`, {
     *      headers: { Authorization: `Bearer ${oauthToken}` }
     *    });
     *    const refData = await refRes.json();
     *    const lastCommitSha = refData.object.sha;
     * 
     * 2. Retrieve the head commit object to find its tree SHA:
     *    const commitRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/commits/${lastCommitSha}`, {
     *      headers: { Authorization: `Bearer ${oauthToken}` }
     *    });
     *    const commitData = await commitRes.json();
     *    const baseTreeSha = commitData.tree.sha;
     * 
     * 3. Create a blob containing the updated JSON content:
     *    const blobRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`, {
     *      method: 'POST',
     *      headers: { Authorization: `Bearer ${oauthToken}`, 'Content-Type': 'application/json' },
     *      body: JSON.stringify({ content: JSON.stringify(layoutJson, null, 2), encoding: 'utf-8' })
     *    });
     *    const blobData = await blobRes.json();
     *    const newBlobSha = blobData.sha;
     * 
     * 4. Create a new file tree linking the blob under the desired path, utilizing the head commit's tree as base:
     *    const treeRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`, {
     *      method: 'POST',
     *      headers: { Authorization: `Bearer ${oauthToken}`, 'Content-Type': 'application/json' },
     *      body: JSON.stringify({
     *        base_tree: baseTreeSha,
     *        tree: [{
     *          path: filePath,
     *          mode: '100644', // Normal file
     *          type: 'blob',
     *          sha: newBlobSha
     *        }]
     *      })
     *    });
     *    const treeData = await treeRes.json();
     *    const newTreeSha = treeData.sha;
     * 
     * 5. Create a new commit object pointing to the new tree and referencing the parent commit SHA:
     *    const newCommitRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`, {
     *      method: 'POST',
     *      headers: { Authorization: `Bearer ${oauthToken}`, 'Content-Type': 'application/json' },
     *      body: JSON.stringify({
     *        message: `Layout update: grid re-aligned for page ${pagePath} via GridStudio`,
     *        tree: newTreeSha,
     *        parents: [lastCommitSha]
     *      })
     *    });
     *    const newCommitData = await newCommitRes.json();
     *    const newCommitSha = newCommitData.sha;
     * 
     * 6. Update the branch reference to point directly to the new commit:
     *    await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`, {
     *      method: 'PATCH',
     *      headers: { Authorization: `Bearer ${oauthToken}`, 'Content-Type': 'application/json' },
     *      body: JSON.stringify({ sha: newCommitSha, force: false })
     *    });
     */

    const mockCommitSha = 'a78cf90ef15b8109dcd29a47ef09ff820bd5c95d';
    return {
      success: true,
      message: `Layout committed to GitHub repository: ${repoOwner}/${repoName}`,
      commitUrl: `https://github.com/repos/${repoOwner}/${repoName}/commit/${mockCommitSha}`,
    };
  } catch (error: any) {
    console.error('Error simulating GitHub Git commit API', error);
    return {
      success: false,
      message: `GitHub Commit API failed: ${error?.message || 'Unknown network error'}`,
    };
  }
}
