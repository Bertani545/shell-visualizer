float[6] C(float t, float theta, mat3 R)
{
  float[6] ans;
  float nf = float(n);

  // ---- Obtain the point p on the generating curve. Note that it is centered at (0,0,0) ----
  // C(t, theta) is a 2D function projected to the plane defined by the vectors N and B. Let's call the original c(theta)

  float c1 = (a*sin(theta)*cos(phi) + cos(theta)*sin(phi)) * (1. + 0.1 * sin(nf * theta));
  float c2 = (a*sin(theta)*sin(phi) - cos(theta)*cos(phi)) * (1. + 0.1 * sin(nf * theta));

  vec3 N = normalize(vec3(b*cos(t)-sin(t), -b*sin(t)-cos(t), 0.));
  vec3 B = normalize(vec3(b*z*(b*sin(t)+cos(t)), b*z*(b*cos(t) - sin(t)), d*(b*b+1.)));
  vec3 p = (exp(b*t) - 1./(t+1.)) * R * (c1 * N + c2 * B);
  ans[0] = p.x; ans[1] = p.y; ans[2] = p.z;

    // ---- Now we obtain the normal at this point -----

    // Obtain the derivative of c(theta) in the plane.
    float df1 = (a*cos(theta)*cos(phi) - sin(theta)*sin(phi)) * (1. + 0.1 * sin(nf * theta)) + 0.1 * nf * (a*sin(theta)*cos(phi) + cos(theta)*sin(phi))*cos(nf*theta);
    float df2 = (a*cos(theta)*sin(phi) + sin(theta)*cos(phi)) * (1. + 0.1 * sin(nf * theta)) + 0.1 * nf * (a*sin(theta)*cos(phi) - cos(theta)*cos(phi))*cos(nf*theta);

    // Project such derivative using the same method as in the paper.
    // This vector is such that is tangent to C(theta)
    vec3 tangent = df1 * N + df2 * B;

    // Vector T is perpendicular to the plane defined by N and B
    vec3 T = normalize(vec3(d*(b*sin(t)+cos(t)), d*(b*cos(t)-sin(t)), -b*z));

    // Cross product gives us the desired normal
    // The order is given by the right-hand rule
    vec3 normal = cross(T, tangent);
    ans[3] = normal.x; ans[4] = normal.y; ans[5] = normal.z;

  return ans;
}