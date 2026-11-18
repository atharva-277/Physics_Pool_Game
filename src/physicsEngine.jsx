import React, { useEffect, useRef } from "react";
import p5 from "p5";
import Matter from "matter-js";

const PhysicsSketch = () => {
  const sketchRef = useRef(null);

  useEffect(() => {
    let myP5;
    let engine;

    const sketch = (p) => {
      const { Engine, Bodies, Composite, Body } = Matter;

      let ball1, ball2;
      let walls = [];

      const radius = 25;
      const width = 600;
      const height = 400;

      let selectedBall = null;
      let startX = 0;
      let startY = 0;

      p.setup = () => {
        const canvas = p.createCanvas(width, height);

        canvas.elt.style.touchAction = "none";

        engine = Engine.create();
        engine.gravity.y = 0;

        const ballOptions = {
          restitution: 0.98,
          friction: 0,
          frictionAir: 0.005,
          density: 0.05,
        };

        ball1 = Bodies.circle(200, 200, radius, ballOptions);
        ball2 = Bodies.circle(400, 200, radius, ballOptions);

        const wallThickness = 60;

        const wallOptions = {
          isStatic: true,
          restitution: 0.98,
        };

        walls = [
          Bodies.rectangle(
            width / 2,
            -wallThickness / 2,
            width + wallThickness * 2,
            wallThickness,
            wallOptions,
          ),

          Bodies.rectangle(
            width / 2,
            height + wallThickness / 2,
            width + wallThickness * 2,
            wallThickness,
            wallOptions,
          ),

          Bodies.rectangle(
            -wallThickness / 2,
            height / 2,
            wallThickness,
            height + wallThickness * 2,
            wallOptions,
          ),

          Bodies.rectangle(
            width + wallThickness / 2,
            height / 2,
            wallThickness,
            height + wallThickness * 2,
            wallOptions,
          ),
        ];

        Composite.add(engine.world, [ball1, ball2, ...walls]);
      };

      p.draw = () => {
        p.background(34, 110, 68);

        Engine.update(engine, 1000 / 60);

        // Draw first ball
        p.fill(255);
        p.noStroke();
        p.circle(ball1.position.x, ball1.position.y, radius * 2);

        // Draw second ball
        p.fill(220, 45, 45);
        p.circle(ball2.position.x, ball2.position.y, radius * 2);

        // Draw swipe indicator
        if (selectedBall) {
          p.stroke(255, 255, 255, 180);
          p.strokeWeight(3);

          p.line(startX, startY, p.mouseX, p.mouseY);
        }
      };

      // Select a ball
      p.mousePressed = () => {
        const balls = [ball1, ball2];

        for (const ball of balls) {
          const dx = p.mouseX - ball.position.x;
          const dy = p.mouseY - ball.position.y;

          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < radius) {
            selectedBall = ball;

            startX = p.mouseX;
            startY = p.mouseY;

            break;
          }
        }
      };

      // Launch the ball when released
      p.mouseReleased = () => {
        if (selectedBall) {
          const dx = p.mouseX - startX;
          const dy = p.mouseY - startY;

          Body.setVelocity(selectedBall, {
            x: dx * 0.12,
            y: dy * 0.12,
          });

          selectedBall = null;
        }
      };
    };

    myP5 = new p5(sketch, sketchRef.current);

    return () => {
      if (myP5) {
        myP5.remove();
      }

      if (engine) {
        Matter.Engine.clear(engine);
      }
    };
  }, []);

  return (
    <div
      ref={sketchRef}
      style={{
        display: "inline-block",
        width: "600px",
        height: "400px",
        overflow: "hidden",
      }}
    />
  );
};

export default PhysicsSketch;
