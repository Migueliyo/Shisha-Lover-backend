import multer from 'multer';
// import fs from 'fs';

// const storage = multer.diskStorage({
//     destination: function (req, file, callback) {
//         callback(null, 'public/users-avatar');
//     },
//     filename: function (req, file, callback) {
//         callback(null, Date.now() + '-' + file.originalname);
//     }
// });

// const storage = multer.diskStorage({
//     destination: function (req, file, callback) {
//         fs.mkdir('public/avatar', function (err) {
//             if (err) {
//                 console.log(err.stack)
//             } else {
//                 callback(null, './uploads');
//             }
//         })
//     },
//     filename: function (req, file, callback) {
//         callback(null, file.fieldname + '-' + Date.now());
//     }
// });

export const uploadMiddleware = () => {
    const upload = multer({
        dest: 'public/users-avatar',
        limits: {
            fileSize: 5000000 // 5mb
        },
        fileFilter: (req, file, callback) => {
            console.log(file);
            if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
                return callback(new Error('Please upload a Picture(PNG or JPEG)'))
            }
            callback(undefined, true);
        }
    
    })

    return (req, res, next) => {
        
        upload.single('file')(req, res, err => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            next();
        });
    };
};