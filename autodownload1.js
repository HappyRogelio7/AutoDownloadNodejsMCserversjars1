const fs = require('fs');
const https = require('https');
const path = require('path');

const filePath = path.join(__dirname, 'jsons', 'versions_request.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const serverTypeSelected = 'test1';

if (!data.versions.hasOwnProperty(serverTypeSelected)) {
    console.log(`El tipo de servidor '${serverTypeSelected}' no está disponible en el archivo JSON.`);
    process.exit(0); // Detener el programa
} else {

    const downloadFolder = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder);
    }

    const serverVersions = data.versions[serverTypeSelected];
    const categoryFolder = path.join(downloadFolder, `${serverTypeSelected}`);
    if (!fs.existsSync(categoryFolder)) {
        fs.mkdirSync(categoryFolder);
    }

    console.log('Iniciando descarga de archivos...\n');

    let count = 0;
    let completedCount = 0; // Variable para contar las descargas completadas

    for (const version in serverVersions) {
        if (serverVersions.hasOwnProperty(version)) {
            const fileInfo = serverVersions[version];
            const { url } = fileInfo;

            if (url !== 'unknown') {
                const fileName = path.basename(url);
                const versionFolder = path.join(categoryFolder, version);
                if (!fs.existsSync(versionFolder)) {
                    fs.mkdirSync(versionFolder);
                }
                const filePath = path.join(versionFolder, fileName);

                const file = fs.createWriteStream(filePath);
                const request = https.get(url, function (response) {
                    response.pipe(file);
                    completedCount++; // Incrementar el contador de descargas completadas
                    checkDownloadCompletion(); // Verificar si todas las descargas han finalizado
                });

                count++;
            }
        }
    }

    console.log('Descargando archivos...\n');

    let progress = 0;
    const progressBar = setInterval(() => {
        const symbols = ['/', '-', '\\', '|'];
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`\r${symbols[progress % symbols.length]} Descargando ${completedCount}/${count} archivos...`);
        progress++;
    }, 200);

    // Función para verificar si todas las descargas han finalizado
    function checkDownloadCompletion() {
        if (completedCount === count) { // Si todas las descargas han finalizado
            clearInterval(progressBar);
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            console.log('Descarga de archivos finalizada.');
            process.exit(0); // Finalizar el programa
        }
    }

    process.on('SIGINT', () => {
        clearInterval(progressBar);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log('\nPrograma detenido.');
        process.exit(0);
    });
}
