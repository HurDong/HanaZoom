import { useEffect, useRef, useState } from "react";

export function useFPSMonitor(active: boolean = false) {
  const [fps, setFps] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);

  useEffect(() => {
    if (!active) {
      setFps(0);
      setAvgFps(0);
      return;
    }

    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime.current;

      // 매 초마다 FPS 계산
      if (deltaTime >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / deltaTime);
        setFps(currentFps);

        // FPS 히스토리 관리 (최근 10초간)
        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > 10) {
          fpsHistory.current.shift();
        }

        // 평균 FPS 계산
        const avgFps = Math.round(
          fpsHistory.current.reduce((sum, fps) => sum + fps, 0) /
            fpsHistory.current.length
        );
        setAvgFps(avgFps);

        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [active]);

  return { fps, avgFps };
}
