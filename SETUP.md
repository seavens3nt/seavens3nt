# Pink Contribution Arcade setup

This folder is a ready-to-upload GitHub profile README.

## Install it

1. Create or open your special profile repository: [`seavens3nt/seavens3nt`](https://github.com/seavens3nt/seavens3nt).
2. Copy all files and folders from this package into the root of that repository, including the hidden `.github` folder.
3. Commit and push the files to the `main` branch.
4. Open the repository's **Actions** tab.
5. Select **Update pink contribution arcade**, then choose **Run workflow**.
6. Wait for the workflow to finish and refresh your profile.

The workflow refreshes the SVG every six hours and commits it only when the generated result changes. The number in the card is the sum of your public contribution-calendar activity over the latest seven available days.

## Preview it locally

The repository includes a generated demo SVG. To rebuild that preview without contacting GitHub:

```bash
node scripts/generate-arcade.mjs --demo --out assets/contribution-arcade.svg
```

## Troubleshooting

If the workflow cannot push the generated SVG, open:

```text
Settings → Actions → General → Workflow permissions
```

Choose **Read and write permissions**, save the setting, and run the workflow again. An organization policy can override this repository setting.

The default `GITHUB_TOKEN` reads public contribution-calendar activity. Private and internal contributions require broader account authorization and are intentionally not configured in this template.
