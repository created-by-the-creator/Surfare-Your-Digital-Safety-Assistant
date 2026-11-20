// Small integration steps keep the spring stable across slow or uneven frames.
export function advanceSpring(position, velocity, target, seconds, damping = 24) {
  let remaining = Math.min(.064, Math.max(0, seconds));
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 240);
    velocity += ((target - position) * 240 - velocity * damping) * dt;
    position += velocity * dt;
    remaining -= dt;
  }
  if (Math.abs(target - position) < .1 && Math.abs(velocity) < 1) {
    return { position: target, velocity: 0 };
  }
  return { position, velocity };
}

export function scrollDamping(distance) {
  // Keep the overshoot gentle even when the tour crosses several sections.
  const overshoot = Math.min(.05, 18 / Math.max(1, Math.abs(distance)));
  const log = Math.log(overshoot);
  return 2 * Math.sqrt(240) * (-log / Math.sqrt(Math.PI ** 2 + log ** 2));
}
