const config = require('config');
const getStream = require('into-stream');
const azureStorage = require('azure-storage');
const getBlobName = originalName => {
    const identifier = Math.random().toString().replace(/0\./, ''); // remove "0." from start of string
    return `${identifier}-${originalName}`;
};

module.exports.uploadFileToBlob = async function (containerName, file) {

    return new Promise((resolve, reject) => {

        const blobName = getBlobName(file.originalname);
        const stream = getStream(file.buffer);
        const streamLength = file.buffer.length;

        const blobService = azureStorage.createBlobService(config.azureStorageConfig.accountName, config.azureStorageConfig.accountKey);
        blobService.createBlockBlobFromStream(containerName, `${blobName}`, stream, streamLength, err => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    filename: blobName,
                    originalname: file.originalname,
                    size: streamLength,
                    path: `${containerName}/${blobName}`,
                    url: `${config.azureStorageConfig.blobURL}${containerName}/${blobName}`
                });
            }
        });

    });
}


module.exports.deleteBlobFromContainer = async function (containerName, blobName) {
    return new Promise((resolve, reject) => {
        const blobService = azureStorage.createBlobService(config.azureStorageConfig.accountName, config.azureStorageConfig.accountKey);
        blobService.deleteBlobIfExists(containerName, blobName, (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(result)
            }
        });
    });
}

module.exports.retrieveBlob = async function (containerName, blobName) {
    return new Promise((resolve, reject) => {
        const blobService = azureStorage.createBlobService(config.azureStorageConfig.accountName, config.azureStorageConfig.accountKey);
        blobService.undeleteBlob(containerName, blobName, (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(result)
            }
        });
    });
}




