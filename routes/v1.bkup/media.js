const express = require('express');
const router = express.Router();
const multer = require('multer')
const inMemoryStorage = multer.memoryStorage();
const singleFileUpload = multer({ storage: inMemoryStorage });
const { check, validationResult } = require('express-validator');
const { uploadFileToBlob, deleteBlobFromContainer,retrieveBlob } = require('../../helpers/media');


// @route    POST /v1/media/picture
// @desc     Upload pictures need to publicly accessible
// @access   Public
router.post('/picture', singleFileUpload.single('image'),
    async (req, res, next) => {
        try {
            const image = await uploadFileToBlob('pictures', req.file); // images is a directory in the Azure container
            return res.json(image);
        } catch (error) {
            next(error);
        }
    }
);
// @route    POST /v1/media/file
// @desc     Upload non picture files need to publicly accessible
// @access   Public
router.post('/file', singleFileUpload.single('image'),
    async (req, res, next) => {
        try {
            const image = await uploadFileToBlob('files', req.file); // images is a directory in the Azure container
            return res.json(image);
        } catch (error) {
            next(error);
        }
    }
);

// @route    DELETE /v1/media/file
// @desc     Delete a blob from a container
// @access   Public
router.delete('/file',
    [
        check('containerName', 'containerName is required').exists(),
        check('blobName', 'blobName is required').exists(),
    ],
    async (req, res, next) => {
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
    }
);
// @route    POST /v1/media/file
// @desc     Retrieve a deleted Blob.
// @access   Public
router.post('/retrieve-file',
    [
        check('containerName', 'containerName is required').exists(),
        check('blobName', 'blobName is required').exists(),
    ],
    async (req, res, next) => {
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
    }
);

module.exports = router;