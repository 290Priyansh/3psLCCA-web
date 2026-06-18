/* eslint-disable no-unused-vars */
import React, { useState, useRef } from 'react';

const ProfileAvatar = ({ size = 80, profileName, logoData, onLogoChange, theme }) => {
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round(width * (MAX_HEIGHT / height));
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.8 quality to keep it under 30KB
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                onLogoChange(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    // Determine display content
    const getDisplayContent = () => {
        if (logoData) {
            return (
                <img 
                    src={logoData} 
                    alt="Profile Logo" 
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                    }}
                />
            );
        }
        
        if (profileName) {
            const letter = profileName[0].toUpperCase();
            // Generate consistent color from name
            const colors = [theme?.activeIconColor || '#8bc34a', '#2196f3', '#4caf50', '#ff9800'];
            const colorIndex = profileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
            const bgColor = colors[colorIndex];
            
            return (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: `${size / 3}px`,
                        fontWeight: 'bold'
                    }}
                >
                    {letter}
                </div>
            );
        }

        // Empty state - show +
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: theme?.border || '#d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme?.textSecondary || '#6b7280',
                    fontSize: `${size / 2}px`,
                    cursor: 'pointer'
                }}
            >
                +
            </div>
        );
    };

    return (
        <>
            <div
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {getDisplayContent()}
                
                {/* Hover overlay */}
                {isHovered && profileName && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        CHANGE
                    </div>
                )}
            </div>
            
            {/* Hidden file input for logo upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/jpg"
                style={{ display: 'none' }}
            />
        </>
    );
};

export default ProfileAvatar;
