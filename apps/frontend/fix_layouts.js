const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.tsx') && fullPath !== path.join(__dirname, 'src', 'app', 'admin', 'layout.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Remove imports
            const importRegex = /import\s+DashboardLayout\s+from\s+['"].*?DashboardLayout.*?['"];?\s*\n?/g;
            if (importRegex.test(content)) {
                content = content.replace(importRegex, '');
                modified = true;
            }

            // Replace tags
            if (content.includes('<DashboardLayout>')) {
                content = content.replace(/<DashboardLayout>/g, '<>');
                modified = true;
            }
            if (content.includes('</DashboardLayout>')) {
                content = content.replace(/<\/DashboardLayout>/g, '</>');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

const adminDir = path.join(__dirname, 'src', 'app', 'admin');
processDirectory(adminDir);
console.log('All layouts fixed.');
