const { validationResult } = require('express-validator');
const { uploadFileToBlob, deleteBlobFromContainer,retrieveBlob } = require('../../../helpers/media');

var apiMedia = {};

apiMedia.uploadPicture = async function(req,res,next){
    try {
        const image = await uploadFileToBlob('pictures', req.file); // images is a directory in the Azure container
        return res.json(image);
    } catch (error) {
        next(error);
    }
};
apiMedia.uploadFile = async function(req,res,next){
    try {
        const image = await uploadFileToBlob('files', req.file); // images is a directory in the Azure container
        return res.json(image);
    } catch (error) {
        next(error);
    }
};

apiMedia.deleteFile = async function(req,res,next){
    try {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res
                .status(400)
                .json({ statusCode: 401, errors: validationErrors.array() });
        }

        const { containerName, blobName } = req.body;
        const result = await deleteBlobFromContainer(containerName, blobName); // 
        console.log('result:',result)
        if (result) {
            return res.status(200).json({
                statusCode: 200,
                data: { msg: 'The blob removed Successfully' },
            });
        } else {
            return res.status(404).json({
                statusCode: 404,
                data: { msg: "Can't find the current blob" },
            });
        }
    } catch (error) {
        next(error);
    }
};
apiMedia.retrieveFile = async function(req,res,next){
    try {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res
                .status(400)
                .json({ statusCode: 401, errors: validationErrors.array() });
        }

        const { containerName, blobName } = req.body;
        const result = await retrieveBlob(containerName, blobName); // 
        console.log('result:',result)
        if (result) {
            return res.status(200).json({
                statusCode: 200,
                data: { msg: 'The blob retrieved Successfully' },
            });
        } else {
            return res.status(404).json({
                statusCode: 404,
                data: { msg: "Can't find the deleted blob" },
            });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = apiMedia;