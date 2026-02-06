document.addEventListener('DOMContentLoaded', () => {
    const REPO_PATH = 'PeterHindes/chess-godot-demo';
    const latestReleaseContainer = document.getElementById('latest-release');
    const versionSelect = document.getElementById('version-select');
    const selectedReleaseInfo = document.getElementById('selected-release-info');

    let allReleases = [];

    console.log(`Fetching releases for ${REPO_PATH}...`);

    fetch(`https://api.github.com/repos/${REPO_PATH}/releases`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`GitHub API error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(releases => {
            // Transform GitHub API response to our app's format
            allReleases = releases.map(gh => ({
                version: gh.tag_name,
                date: new Date(gh.published_at).toLocaleDateString(),
                description: gh.body || "No description provided.",
                platforms: mapAssetsToPlatforms(gh.assets),
                url: gh.html_url
            }));

            if (allReleases.length === 0) {
                if (latestReleaseContainer) {
                    latestReleaseContainer.innerHTML = '<p>No releases available on GitHub yet.</p>';
                }
                return;
            }

            // 1. Handle Latest Release
            renderLatestRelease(allReleases[0]);

            // 2. Populate Dropdown
            if (versionSelect) {
                allReleases.forEach((release, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${release.version} (${release.date})`;
                    versionSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error in release process:', error);
            if (latestReleaseContainer) {
                latestReleaseContainer.innerHTML = `<p>Error loading releases: ${error.message}</p>`;
            }
        });

    function mapAssetsToPlatforms(assets) {
        const platforms = {
            windows: null,
            mac: null,
            linux: null
        };

        assets.forEach(asset => {
            const name = asset.name.toLowerCase();
            const url = asset.browser_download_url;

            if (name.includes('win') || name.endsWith('.exe') || name.endsWith('.msi')) {
                platforms.windows = url;
            } else if (name.includes('mac') || name.includes('osx') || name.includes('apple') || name.endsWith('.dmg')) {
                platforms.mac = url;
            } else if (name.includes('linux') || name.endsWith('.tar.gz') || name.endsWith('.appimage')) {
                platforms.linux = url;
            }
        });

        return platforms;
    }

    function renderLatestRelease(release) {
        if (!latestReleaseContainer) return;

        const downloadButtons = generateDownloadButtons(release.platforms);

        latestReleaseContainer.innerHTML = `
            <div class="latest-meta">
                <span class="version-badge">${release.version}</span>
                <div class="gh-description">${formatDescription(release.description)}</div>
            </div>
            <div class="download-buttons">
                ${downloadButtons}
            </div>
            <a href="${release.url}" target="_blank" class="view-on-github">View on GitHub</a>
        `;
    }

    function generateDownloadButtons(platforms) {
        let html = '';
        if (platforms.windows) {
            html += `<a href="${platforms.windows}" class="btn-download"><i class="fab fa-windows"></i> Windows</a>`;
        }
        if (platforms.mac) {
            html += `<a href="${platforms.mac}" class="btn-download"><i class="fab fa-apple"></i> macOS</a>`;
        }
        if (platforms.linux) {
            html += `<a href="${platforms.linux}" class="btn-download"><i class="fab fa-linux"></i> Linux</a>`;
        }
        return html || '<p class="no-assets">No platform-specific builds found for this release.</p>';
    }

    function formatDescription(desc) {
        // Simple markdown-to-html for line breaks and basic formatting
        return desc
            .replace(/\r\n/g, '<br>')
            .replace(/\n/g, '<br>')
            .split('<br>').slice(0, 3).join('<br>') + (desc.split('\n').length > 3 ? '...' : '');
    }

    if (versionSelect) {
        versionSelect.addEventListener('change', (e) => {
            const index = e.target.value;
            if (!selectedReleaseInfo) return;

            if (index === "") {
                selectedReleaseInfo.classList.remove('active');
                return;
            }

            const release = allReleases[index];
            if (release) {
                selectedReleaseInfo.innerHTML = `
                    <h3>Version ${release.version}</h3>
                    <p class="release-date">Released on ${release.date}</p>
                    <div class="release-desc">${release.description.replace(/\n/g, '<br>')}</div>
                    <div class="archive-downloads">
                        <h4>Downloads:</h4>
                        <div class="featured-download">
                            ${generateDownloadButtons(release.platforms)}
                        </div>
                    </div>
                `;
                selectedReleaseInfo.classList.add('active');
            }
        });
    }
});
