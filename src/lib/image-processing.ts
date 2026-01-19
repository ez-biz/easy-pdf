export const removeWhiteBackground = async (imageSrc: string, threshold = 220): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas context not available"));
                return;
            }
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Check if pixel is light enough
                if (r > threshold && g > threshold && b > threshold) {
                    data[i + 3] = 0; // Alpha = 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
};

export const changeImageColor = async (imageSrc: string, targetColorHex: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas context not available"));
                return;
            }
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Parse target color
            const rTarget = parseInt(targetColorHex.slice(1, 3), 16);
            const gTarget = parseInt(targetColorHex.slice(3, 5), 16);
            const bTarget = parseInt(targetColorHex.slice(5, 7), 16);

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const alpha = data[i + 3];

                // Only change color if pixel is visible AND dark enough (prevent tinting white background)
                if (alpha > 0) {
                    const brightness = (r + g + b) / 3;
                    if (brightness < 230) {
                        data[i] = rTarget;
                        data[i + 1] = gTarget;
                        data[i + 2] = bTarget;
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
};
