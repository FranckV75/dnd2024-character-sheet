import fs from 'fs';

(async () => {
    try {
        console.log("Fetching feats list from AideDD...");
        const res = await fetch('https://www.aidedd.org/feat/fr/');
        const html = await res.text();

        // Match links to individual feats (format: <a href='fr/adepte-elementaire' ...)
        const matches = [...html.matchAll(/<a href='fr\/([^']+)'[^>]*>([^<]+)<\/a>/g)];
        console.log(`Found ${matches.length} feats.`);

        const feats = {};

        for (const match of matches) {
            const id = match[1].replace(/-/g, '_');
            const url = 'https://www.aidedd.org/feat/fr/' + match[1];

            console.log(`Fetching ${url}...`);
            const fres = await fetch(url);
            const fhtml = await fres.text();

            // Extract Name
            let name = match[2];
            const nameMatch = fhtml.match(/<h1>(.*?)<\/h1>/);
            if (nameMatch) name = nameMatch[1];

            // Extract Type and Prereq
            let type = "Général";
            let prereq = "Aucun";
            const reqMatch = fhtml.match(/<div class='prerequis'>(.*?)<\/div>/i);
            if (reqMatch) {
                const reqText = reqMatch[1];
                if (reqText.toLowerCase().includes("origine")) type = "Origine";
                else if (reqText.toLowerCase().includes("épique") || reqText.toLowerCase().includes("epique")) type = "Épique";
                else type = "Général";

                const pMatch = reqText.match(/prérequis\s*:\s*([^)]+)/i);
                if (pMatch) {
                    prereq = pMatch[1].replace(/<[^>]+>/g, '').trim();
                } else {
                    if (type === "Origine") prereq = "Niv 1+";
                    if (type === "Général") prereq = "Niv 4+";
                    if (type === "Épique") prereq = "Niv 19+";
                }
            }

            // Extract Description
            let desc = "";
            let asi = "Aucune";
            const parts = fhtml.split(/<div class=['"]description['"]>/i);
            if (parts.length > 1) {
                let descHtml = parts[1];
                let endIdx = descHtml.search(/<div class=['"](source|trad|clear)['"]/i);
                if (endIdx === -1) endIdx = descHtml.search(/<ol itemscope/i);
                if (endIdx !== -1) {
                    desc = descHtml.substring(0, endIdx).trim();
                    // extract ASI
                    const asiMatch = desc.match(/Augmentez votre ([^0-9]+?) de 1/i);
                    if (asiMatch) {
                        let rawStats = asiMatch[1]
                            .replace(/jusqu['’]à/gi, '')
                            .replace(/ou/gi, '')
                            .replace(/de/gi, '')
                            .replace(/,/g, '')
                            .replace(/valeur/gi, '')
                            .trim();
                        const statMap = {
                            "force": "For",
                            "dextér": "Dex", // dextérité
                            "dexter": "Dex",
                            "constitution": "Con",
                            "intelligence": "Int",
                            "sagesse": "Sag",
                            "charisme": "Cha"
                        };
                        const asiParts = rawStats.toLowerCase().split(/\s+/);
                        let mapped = [];
                        asiParts.forEach(p => {
                            for (const [k, v] of Object.entries(statMap)) {
                                if (p.includes(k)) {
                                    if (!mapped.includes(v)) mapped.push(v);
                                }
                            }
                        });
                        if (mapped.length > 0) asi = "+1 " + mapped.join(" ou ");
                    }

                    // clean up HTML in desc
                    desc = desc.replace(/(<br>)*<\/div>(\s*<br>)*$/i, '').trim();
                    desc = desc.replace(/\n|\r/g, ' ').replace(/\s{2,}/g, ' ');
                }
            } else {
                console.log(`WARNING: Description not found for ${name}`);
            }

            feats[id] = {
                name,
                type,
                prereq,
                asi,
                desc
            };

            // tiny sleep to avoid overwhelming server
            await new Promise(r => setTimeout(r, 50));
        }

        let output = `// =============================================================================\n`;
        output += `// FEATS-DATA.JS - Base de données exhaustive des Dons D&D 2024\n`;
        output += `// Généré automatiquement depuis AideDD\n`;
        output += `// =============================================================================\n\n`;
        output += `const FEATS_DATA = ` + JSON.stringify(feats, null, 4) + `;\n`;

        fs.writeFileSync('js/feats-data.js', output, 'utf-8');
        console.log("js/feats-data.js successfully generated with " + Object.keys(feats).length + " feats.");
    } catch (e) {
        console.error("Error:", e);
    }
})();
