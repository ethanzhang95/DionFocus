/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

 import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
 import Stats from 'stats.js';
 import * as tf from '@tensorflow/tfjs-core';
 import '@tensorflow/tfjs-backend-webgl';
 import '@tensorflow/tfjs-backend-cpu';
 
 import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
 
 import {TRIANGULATION} from './triangulation';
 
 tfjsWasm.setWasmPaths(
     `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`);
 
 const NUM_KEYPOINTS = 468;
 const NUM_IRIS_KEYPOINTS = 5;
 const GREEN = '#32EEDB';
 const RED = "#FF2C35";
 const BLUE = "#157AB3";
 let count = 0;
 let pointsOff = 0;
 let blinkCount = 0;
 let totalTime = 0;
 
 function isMobile() {
   const isAndroid = /Android/i.test(navigator.userAgent);
   const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
   return isAndroid || isiOS;
 }
 
 function distance(a, b) {
   return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
 }
 
 function drawPath(ctx, points, closePath) {
   const region = new Path2D();
   region.moveTo(points[0][0], points[0][1]);
   for (let i = 1; i < points.length; i++) {
     const point = points[i];
     region.lineTo(point[0], point[1]);
   }
 
   if (closePath) {
     region.closePath();
   }
   ctx.stroke(region);
 }
 
 let model, ctx, videoWidth, videoHeight, video, canvas,
     scatterGLHasInitialized = false, scatterGL, rafID;
 
 const VIDEO_SIZE = 500;
 //const mobile = isMobile();
 const mobile = true;
 // Don't render the point cloud on mobile in order to maximize performance and
 // to avoid crowding limited screen space.
 const renderPointcloud = mobile === false;
 const stats = new Stats();
 const state = {
   backend: 'webgl',
   maxFaces: 1,
   triangulateMesh: true,
   predictIrises: true
 };
 
 if (renderPointcloud) {
   state.renderPointcloud = true;
 }
 
 function setupDatGui() {
   const gui = new dat.GUI();
   gui.add(state, 'backend', ['webgl', 'wasm', 'cpu'])
       .onChange(async backend => {
         window.cancelAnimationFrame(rafID);
         await tf.setBackend(backend);
         requestAnimationFrame(renderPrediction);
       });
 
   gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => {
     model = await faceLandmarksDetection.load(
       faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
       {maxFaces: val});
   });
 
   gui.add(state, 'triangulateMesh');
   gui.add(state, 'predictIrises');
 
   if (renderPointcloud) {
     gui.add(state, 'renderPointcloud').onChange(render => {
       document.querySelector('#scatter-gl-container').style.display =
           render ? 'inline-block' : 'none';
     });
   }
 }
 
 async function setupCamera() {
   video = document.getElementById('video');
 
   const stream = await navigator.mediaDevices.getUserMedia({
     'audio': false,
     'video': {
       facingMode: 'user',
       // Only setting the video to a specified size in order to accommodate a
       // point cloud, so on mobile devices accept the default size.
       width: mobile ? undefined : VIDEO_SIZE,
       height: mobile ? undefined : VIDEO_SIZE
     },
   });
   video.srcObject = stream;
 
   return new Promise((resolve) => {
     video.onloadedmetadata = () => {
       resolve(video);
     };
   });
 }
 


 async function renderPrediction() {
   stats.begin();
   
   let startTime = performance.now();
   const predictions = await model.estimateFaces({
     input: video,
     returnTensors: false,
     flipHorizontal: false,
     predictIrises: state.predictIrises
   });
   ctx.drawImage(
       video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);
   if (predictions.length > 0) {
     predictions.forEach(prediction => {
       const keypoints = prediction.scaledMesh;
       //console.log(keypoints);
       if(Math.abs(keypoints[161][1]-keypoints[163][1]) < 5 && Math.abs(keypoints[160][1]-keypoints[144][1]) < 5 && 
       Math.abs(keypoints[159][1]-keypoints[145][1]) < 5 && Math.abs(keypoints[158][1]-keypoints[153][1]) < 5 && 
       Math.abs(keypoints[157][1]-keypoints[154][1]) < 5 && Math.abs(keypoints[388][1]-keypoints[390][1]) < 5 && 
       Math.abs(keypoints[387][1]-keypoints[373][1]) < 5 && Math.abs(keypoints[386][1]-keypoints[374][1]) < 5 && 
       Math.abs(keypoints[385][1]-keypoints[380][1]) < 5 && Math.abs(keypoints[384][1]-keypoints[382][1]) < 5)
       {
        count+=1;
        //blinkCount+=1; 
        //console.log("YOURS EYES ARE CLOSED");
        //console.log(count);
       }
       else{
          //console.log("RESET");
          if(count!=0){
            blinkCount+=1;
            console.log("YOU BLINKED");
          }
          count = 0;
       }
       if (count==150){
          pointsOff+=1;
          count=0;
       } 
       //console.log(pointsOff);
       if (state.triangulateMesh) {
         ctx.strokeStyle = "#43947B";
         ctx.lineWidth = 0.5;
 
         for (let i = 0; i < TRIANGULATION.length / 3; i++) {
           const points = [
             TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1],
             TRIANGULATION[i * 3 + 2]
           ].map(index => keypoints[index]);
 
           drawPath(ctx, points, true);
         }
       } else {
         ctx.fillStyle = "#43947B";
 
         for (let i = 0; i < NUM_KEYPOINTS; i++) {
           const x = keypoints[i][0];
           const y = keypoints[i][1];
 
           ctx.beginPath();
           ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
           ctx.fill();
         }
       }
 
       if(keypoints.length > NUM_KEYPOINTS) {
         ctx.strokeStyle = BLUE;
         ctx.lineWidth = 3.5;
 
         const leftCenter = keypoints[NUM_KEYPOINTS];
         const leftDiameterY = distance(
           keypoints[NUM_KEYPOINTS + 4],
           keypoints[NUM_KEYPOINTS + 2]);
         const leftDiameterX = distance(
           keypoints[NUM_KEYPOINTS + 3],
           keypoints[NUM_KEYPOINTS + 1]);
 
         ctx.beginPath();
         ctx.ellipse(leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI);
         ctx.stroke();
 
         if(keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
           const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
           const rightDiameterY = distance(
             keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
             keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
           const rightDiameterX = distance(
             keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
             keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);
 
           ctx.beginPath();
           ctx.ellipse(rightCenter[0], rightCenter[1], rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI);
           ctx.stroke();
         }
       }
     });
 
     if (renderPointcloud && state.renderPointcloud && scatterGL != null) {
       const pointsData = predictions.map(prediction => {
         let scaledMesh = prediction.scaledMesh;
         return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
       });
 
       let flattenedPointsData = [];
       for (let i = 0; i < pointsData.length; i++) {
         flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
       }
       const dataset = new ScatterGL.Dataset(flattenedPointsData);
 
       if (!scatterGLHasInitialized) {
         scatterGL.setPointColorer((i) => {
           if(i % (NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS * 2) > NUM_KEYPOINTS) {
             return RED;
           }
           return BLUE;
         });
         scatterGL.render(dataset);
       } else {
         scatterGL.updateDataset(dataset);
       }
       scatterGLHasInitialized = true;
     }
   }
 
   stats.end();
   rafID = requestAnimationFrame(renderPrediction);
   let elapsed = performance.now() - startTime;
   totalTime += elapsed;
  //  console.log("elapsed:" + elapsed);
  //  console.log("totalTime:" + totalTime);
   if(totalTime >= 60000)
   {
     let score = 100.5-0.5*Math.exp(0.26 * blinkCount);
     console.log("blinkcount:" + blinkCount);
     if(score<0) score = 0;
     console.log("score:" + score);
     document.getElementById('myTextarea').value = "focus score:" + Math.round(score);
     blinkCount = 0;
     totalTime = 0;
   }
 };
 
 async function main() {
   await tf.setBackend(state.backend);
   //setupDatGui();
 
   //stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
   //document.getElementById('main').appendChild(stats.dom);
 
   await setupCamera();
   video.play();
   videoWidth = video.videoWidth;
   videoHeight = video.videoHeight;
   video.width = videoWidth;
   video.height = videoHeight;
 
   canvas = document.getElementById('output');
   canvas.width = videoWidth;
   canvas.height = videoHeight;
   const canvasContainer = document.querySelector('.canvas-wrapper');
   canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;
 
   ctx = canvas.getContext('2d');
   ctx.translate(canvas.width, 0);
   ctx.scale(-1, 1);
   ctx.fillStyle = GREEN;
   ctx.strokeStyle = GREEN;  //temp
   ctx.lineWidth = 0.5;  
 
    model = await faceLandmarksDetection.load(
     faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
     {maxFaces: state.maxFaces});
    let t0 = performance.now()/1000;
    renderPrediction();
   //console.log("YOUR SCORE IS " + (100 - pointsOff));
 
   if (renderPointcloud) {
     document.querySelector('#scatter-gl-container').style =
         `width: ${VIDEO_SIZE}px; height: ${VIDEO_SIZE}px;`;
 
     scatterGL = new ScatterGL(
         document.querySelector('#scatter-gl-container'),
         {'rotateOnStart': false, 'selectEnabled': false});
   }
 };
 
 main();
 