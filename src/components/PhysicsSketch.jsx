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
        rail: 56,
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

        engine.world.gravity.x = 0;
        engine.world.gravity.y = 0;

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
        const r = TABLE.rail;
        const middleX = TABLE.middleX;
        const middleY = TABLE.middleY;

        const wallThickness = 14;
        const cornerGap = 30;
        const middleGap = 30;
        createWall(
          (r + cornerGap + middleX - middleGap) / 2,
          r,
          middleX - middleGap - r - cornerGap,
          wallThickness,
        );

        createWall(
          (middleX + middleGap + width - r - cornerGap) / 2,
          r,
          width - r - cornerGap - middleX - middleGap,
          wallThickness,
        );

        createWall(
          (r + cornerGap + middleX - middleGap) / 2,
          height - r,
          middleX - middleGap - r - cornerGap,
          wallThickness,
        );

        createWall(
          (middleX + middleGap + width - r - cornerGap) / 2,
          height - r,
          width - r - cornerGap - middleX - middleGap,
          wallThickness,
        );

        createWall(
          r,
          (r + cornerGap + middleY - middleGap) / 2,
          wallThickness,
          middleY - middleGap - r - cornerGap,
        );

        createWall(
          r,
          (middleY + middleGap + height - r - cornerGap) / 2,
          wallThickness,
          height - r - cornerGap - middleY - middleGap,
        );

        createWall(
          width - r,
          (r + cornerGap + middleY - middleGap) / 2,
          wallThickness,
          middleY - middleGap - r - cornerGap,
        );

        createWall(
          width - r,
          (middleY + middleGap + height - r - cornerGap) / 2,
          wallThickness,
          height - r - cornerGap - middleY - middleGap,
        );

        createPockets();
      }

      function createPockets() {
        const r = TABLE.rail;
        const midX = TABLE.middleX;
        const midY = TABLE.middleY;

        const positions = [
          { x: r, y: r },
          { x: midX, y: r },
          { x: width - r, y: r },

          { x: r, y: height - r },
          { x: midX, y: height - r },
          { x: width - r, y: height - r },
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

        const forceScale = 0.005;

        Matter.Body.applyForce(selectedBall, selectedBall.position, {
          x: dx * forceScale,
          y: dy * forceScale,
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
