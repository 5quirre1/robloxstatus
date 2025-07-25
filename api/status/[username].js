/*
 *  ================================================
 *  -------------roblox status thing---------------
 *          CODE BY SQUIRREL GREG ACORNS!!
 *  =================================================
 *        Give credit if you steal my code sob
 *  =================================================
 *  /////////////////////////////////////////////////////////////////////////////
 *  MIT License
 *  
 *  Copyright (c) 2025 Squirrel
 *  
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *  
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *  /////////////////////////////////////////////////////////////////////////////
 */
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
export default async function handler(req, res) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'username parameter is required' });
    }
    try {
      GlobalFonts.registerFromPath(path.join(process.cwd(), 'public/fonts/arial.ttf'), 'Arial');
    } catch (fontError) {
      console.log('Custom font not found, using system defaults');
    }
    const userResponse = await fetch(`https://users.roblox.com/v1/usernames/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: true
      })
    });
    const userData = await userResponse.json();
    if (!userData.data || userData.data.length === 0) {
      return res.status(404).json({ error: 'user not found' });
    }
    const userId = userData.data[0].id;
    const displayName = userData.data[0].displayName;
    const actualUsername = userData.data[0].name;
    const presenceResponse = await fetch(`https://presence.roblox.com/v1/presence/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: [userId]
      })
    });
    const presenceData = await presenceResponse.json();
    const userPresence = presenceData.userPresences[0];
    const avatarResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`);
    const avatarData = await avatarResponse.json();
    const avatarUrl = avatarData.data[0]?.imageUrl;
    const width = 500;
    const height = 200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < width; i += 20) {
      for (let j = 0; j < height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.fillRect(i, j, 10, 10);
        }
      }
    }
    if (avatarUrl) {
      try {
        const avatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(80, 100, 60, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 20, 40, 120, 120);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(80, 100, 60, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
      } catch (error) {
        console.error('error loading avatar:', error);
      }
    }
    const isOnline = userPresence.userPresenceType === 1 || userPresence.userPresenceType === 2;
    const isPlaying = userPresence.userPresenceType === 2;
    const statusColor = isOnline ? '#00ff00' : '#ff4444';
    ctx.beginPath();
    ctx.arc(125, 65, 15, 0, Math.PI * 2, true);
    ctx.fillStyle = statusColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    addRoundRectPath(ctx, 160, 30, 320, 140, 15);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(displayName, 180, 60);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`@${actualUsername}`, 180, 85);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ffffff';
    let statusText = isOnline ? 'Online' : 'Offline';
    ctx.fillText(`Status: ${statusText}`, 180, 115);
    // ts is NOT working, i don't know why gamename and shit isn't workomgh sob
    if (isPlaying) {
      try {
        const gameResponse = await fetch(`https://games.roblox.com/v1/games?universeIds=${userPresence.universeId}`);
        const gameData = await gameResponse.json();
        const gameName = gameData.data[0]?.name || 'Unknown Game';
        ctx.font = '16px Arial';
        ctx.fillStyle = '#90EE90';
        ctx.fillText(`Playing: ${gameName}`, 180, 140);
      } catch (error) {
        console.error(error);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#90EE90';
        ctx.fillText('Playing a game', 180, 140);
      }
    } else if (isOnline) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#ffff99';
      ctx.fillText('Online but not playing', 180, 140);
    } else {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#ff9999';
      ctx.fillText('Not playing || offline', 180, 140);
    }
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('error generating status image:', error);
    res.status(500).json({ error: 'failed to generate status image' });
  }
}
function addRoundRectPath(ctx, x, y, width, height, radius) {
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    radius = {tl: 0, tr: 0, br: 0, bl: 0, ...radius};
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}
