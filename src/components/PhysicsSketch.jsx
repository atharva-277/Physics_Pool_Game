import React, { useEffect, useRef } from "react";
import p5 from "p5";
import Matter from "matter-js";

const PhysicsSketch = () => {
  const sketchRef = useRef(null);

  useEffect(() => {
    let myP5;

    const sketch = (p) => {
      const width = 900;
      const height = 560;

      const TABLE = {
        rail: 38,
        middleX: width / 2,
        middleY: height / 2,
        pocketRadius: 27,
      };

      const ballRadius = 12;

      const COLORS = {
        wood: "#754523",
        woodHighlight: "#A16A3D",
        felt: "#176B42",
        feltHighlight: "#237C50",
        pocket: "#101010",
        whiteBall: "#F5F5F0",
        redBall: "#C83C36",
      };

      let engine;
      let world;

      let balls = [];
      let pockets = [];

      let selectedBall = null;
      let dragStart = null;
      let dragCurrent = null;

      const pocketedBodies = new Set();

      function initializeEngine() {
        engine = Matter.Engine.create();
        world = engine.world;

        engine.gravity.x = 0;
        engine.gravity.y = 0;

        engine.positionIterations = 8;
        engine.velocityIterations = 6;
      }

      function createWall(x, y, width, height) {
        const wall = Matter.Bodies.rectangle(x, y, width, height, {
          isStatic: true,
          restitution: 0.85,
          friction: 0.05,
          label: "rail",
        });
        Matter.World.add(world, wall);
      }

      function createTable() {
        const feltLeft = 34;
        const feltRight = width - 34; // 866
        const feltTop = 34;
        const feltBottom = height - 34; // 526

        const middleX = TABLE.middleX; // 450
        const wallThickness = 40;
        const halfThickness = wallThickness / 2;
        const cornerGap = 30;
        const middleGap = 30;

        // 1. Top-Left Rail (Bottom edge sits exactly at y = feltTop)
        const topLeftStartX = feltLeft + cornerGap;
        const topLeftEndX = middleX - middleGap / 2;
        createWall(
          (topLeftStartX + topLeftEndX) / 2,
          feltTop - halfThickness,
          topLeftEndX - topLeftStartX,
          wallThickness,
        );

        // 2. Top-Right Rail (Bottom edge sits exactly at y = feltTop)
        const topRightStartX = middleX + middleGap / 2;
        const topRightEndX = feltRight - cornerGap;
        createWall(
          (topRightStartX + topRightEndX) / 2,
          feltTop - halfThickness,
          topRightEndX - topRightStartX,
          wallThickness,
        );

        // 3. Bottom-Left Rail (Top edge sits exactly at y = feltBottom)
        createWall(
          (topLeftStartX + topLeftEndX) / 2,
          feltBottom + halfThickness,
          topLeftEndX - topLeftStartX,
          wallThickness,
        );

        // 4. Bottom-Right Rail (Top edge sits exactly at y = feltBottom)
        createWall(
          (topRightStartX + topRightEndX) / 2,
          feltBottom + halfThickness,
          topRightEndX - topRightStartX,
          wallThickness,
        );

        // 5. Left Rail (Right edge sits exactly at x = feltLeft)
        const leftStartY = feltTop + cornerGap;
        const leftEndY = feltBottom - cornerGap;
        createWall(
          feltLeft - halfThickness,
          (leftStartY + leftEndY) / 2,
          wallThickness,
          leftEndY - leftStartY,
        );

        // 6. Right Rail (Left edge sits exactly at x = feltRight)
        createWall(
          feltRight + halfThickness,
          (leftStartY + leftEndY) / 2,
          wallThickness,
          leftEndY - leftStartY,
        );

        createPockets();
      }

      function createPockets() {
        const feltLeft = 34;
        const feltRight = width - 34;
        const feltTop = 34;
        const feltBottom = height - 34;
        const midX = TABLE.middleX;

        const positions = [
          { x: feltLeft, y: feltTop }, // Top-Left corner
          { x: midX, y: feltTop }, // Top-Middle
          { x: feltRight, y: feltTop }, // Top-Right corner
          { x: feltLeft, y: feltBottom }, // Bottom-Left corner
          { x: midX, y: feltBottom }, // Bottom-Middle
          { x: feltRight, y: feltBottom }, // Bottom-Right corner
        ];

        positions.forEach((position) => {
          const pocket = Matter.Bodies.circle(
            position.x,
            position.y,
            TABLE.pocketRadius,
            {
              isStatic: true,
              isSensor: true,
              label: "pocket",
            },
          );

          pocket.isPocket = true;
          pockets.push(pocket);
        });

        Matter.World.add(world, pockets);
      }

      function createBall(x, y, color) {
        const ball = Matter.Bodies.circle(x, y, ballRadius, {
          restitution: 0.92,
          friction: 0.02,
          frictionAir: 0.002,
          density: 0.001,
          label: "ball",
        });

        ball.ballColor = color;
        ball.isBall = true;

        balls.push(ball);

        Matter.World.add(world, ball);
      }

      function initializeBalls() {
        createBall(320, 280, COLORS.whiteBall);
        createBall(390, 280, COLORS.redBall);
      }

      function handleCollisions(event) {
        event.pairs.forEach((pair) => {
          const bodyA = pair.bodyA;
          const bodyB = pair.bodyB;

          let ball = null;
          let pocket = null;

          if (bodyA.isBall && bodyB.isPocket) {
            ball = bodyA;
            pocket = bodyB;
          } else if (bodyB.isBall && bodyA.isPocket) {
            ball = bodyB;
            pocket = bodyA;
          }

          if (ball && pocket) {
            pocketedBodies.add(ball);
          }
        });
      }

      function removePocketedBalls() {
        pocketedBodies.forEach((ball) => {
          Matter.World.remove(world, ball);

          balls = balls.filter((item) => item !== ball);

          if (selectedBall === ball) {
            selectedBall = null;
            dragStart = null;
            dragCurrent = null;
          }
        });

        pocketedBodies.clear();
      }

      function drawTable() {
        p.push();

        p.noStroke();
        p.fill(COLORS.wood);
        p.rect(0, 0, width, height, 20);

        p.stroke(COLORS.woodHighlight);
        p.strokeWeight(3);
        p.noFill();
        p.rect(8, 8, width - 16, height - 16, 16);

        p.noStroke();
        p.fill(COLORS.felt);
        p.rect(34, 34, width - 68, height - 68, 8);

        p.stroke(COLORS.feltHighlight);
        p.strokeWeight(2);
        p.noFill();
        p.rect(43, 43, width - 86, height - 86, 5);

        drawPockets();

        p.pop();
      }

      function drawPockets() {
        pockets.forEach((pocket) => {
          const { x, y } = pocket.position;

          p.noStroke();
          p.fill("#33251D");
          p.circle(x, y, 62);

          p.fill(COLORS.pocket);
          p.circle(x, y, TABLE.pocketRadius * 2);

          p.fill("#050505");
          p.circle(x, y, 40);
        });
      }

      function drawBalls() {
        balls.forEach((ball) => {
          const { x, y } = ball.position;

          p.push();

          p.noStroke();
          p.fill(0, 70);
          p.circle(x + 3, y + 3, ballRadius * 2);

          p.fill(ball.ballColor);
          p.circle(x, y, ballRadius * 2);

          p.fill(255, 130);
          p.circle(x - 4, y - 4, 5);

          p.pop();
        });
      }

      function drawAimingLine() {
        if (!selectedBall || !dragStart || !dragCurrent) {
          return;
        }

        const dx = dragStart.x - dragCurrent.x;
        const dy = dragStart.y - dragCurrent.y;

        p.push();

        p.stroke(255, 220);
        p.strokeWeight(2);
        p.drawingContext.setLineDash([8, 6]);

        p.line(
          selectedBall.position.x,
          selectedBall.position.y,
          selectedBall.position.x + dx,
          selectedBall.position.y + dy,
        );

        p.drawingContext.setLineDash([]);

        p.pop();
      }

      function handleMousePressed() {
        const mouseX = p.mouseX;
        const mouseY = p.mouseY;

        selectedBall = balls.find((ball) => {
          const dx = ball.position.x - mouseX;
          const dy = ball.position.y - mouseY;

          const distance = Math.sqrt(dx * dx + dy * dy);

          return distance <= ballRadius + 5;
        });

        if (selectedBall) {
          dragStart = {
            x: mouseX,
            y: mouseY,
          };

          dragCurrent = {
            x: mouseX,
            y: mouseY,
          };
        }

        return false;
      }

      function handleMouseDragged() {
        if (selectedBall) {
          dragCurrent = {
            x: p.mouseX,
            y: p.mouseY,
          };
        }

        return false;
      }

      function handleMouseReleased() {
        if (!selectedBall || !dragStart || !dragCurrent) {
          return;
        }

        let dx = dragStart.x - dragCurrent.x;
        let dy = dragStart.y - dragCurrent.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        const maxDistance = 180;

        if (distance > maxDistance) {
          const scale = maxDistance / distance;

          dx *= scale;
          dy *= scale;
        }

        const speedScale = 0.15;

        Matter.Body.setVelocity(selectedBall, {
          x: dx * speedScale,
          y: dy * speedScale,
        });

        selectedBall = null;
        dragStart = null;
        dragCurrent = null;

        return false;
      }

      p.setup = () => {
        const canvas = p.createCanvas(width, height);

        canvas.parent(sketchRef.current);

        p.frameRate(60);

        initializeEngine();
        createTable();
        initializeBalls();

        Matter.Events.on(engine, "collisionStart", handleCollisions);
      };

      p.draw = () => {
        Matter.Engine.update(engine, 1000 / 60);

        removePocketedBalls();

        drawTable();
        drawBalls();
        drawAimingLine();
      };

      p.mousePressed = handleMousePressed;
      p.mouseDragged = handleMouseDragged;
      p.mouseReleased = handleMouseReleased;
    };

    myP5 = new p5(sketch, sketchRef.current);

    return () => {
      if (myP5) {
        myP5.remove();
      }
    };
  }, []);

  return <div ref={sketchRef} className="physics-sketch" />;
};

export default PhysicsSketch;
