import fs from 'fs';
fetch('https://www.aidedd.org/feat/fr/adepte-elementaire').then(r => r.text()).then(fhtml => {
    let desc = "NOT FOUND";
    const parts = fhtml.split(/<div class=['"]description['"]>/i);
    if (parts.length > 1) {
        let descHtml = parts[1];
        let endIdx = descHtml.search(/<div class=['"](source|trad|clear)['"]/i);
        if (endIdx === -1) endIdx = descHtml.search(/<ol itemscope/i);
        if (endIdx !== -1) {
            desc = descHtml.substring(0, endIdx).trim();
            // clean up trailing </div>
            desc = desc.replace(/(<br>)*<\/div>(\s*<br>)*$/i, '').trim();
        }
    }
    console.log(desc);
});
