float[6] C(float t, float theta, mat3 R)
{
  float[6] ans;
  vec3 N = normalize(vec3(b*cos(t)-sin(t), -b*sin(t)-cos(t), 0.));
  vec3 B = normalize(vec3(b*z*(b*sin(t)+cos(t)), b*z*(b*cos(t) - sin(t)), d*(b*b+1.)));
  float nf = float(n);
  vec3 p = (exp(b*t) - 1./(t+1.)) * R * ((a*sin(theta)*cos(phi) + cos(theta)*sin(phi)) * (1. + 0.1 * sin(nf * theta)) * N + (a*sin(theta)*sin(phi)-cos(theta)*cos(phi)) * (1. + 0.1 * sin(nf * theta)) * B);
  ans[0] = p.x; ans[1] = p.y; ans[2] = p.z;

  vec3 dN = vec3(- b*sin(t) - cos(t),sin(t) - b * cos(t), 0 ) * inversesqrt(b*b+1.);
  vec3 dB = vec3(b*z*(b*cos(t)-sin(t)), -b*z*(b*sin(t) + cos(t)), 0) * inversesqrt((b*b+1.) * ((b*b+1.)*d*d + b*b*z*z));

  vec3 d_theta = (exp(b*t)-1./(t+1.)) * R *
  (
    N * (a*cos(theta)*cos(phi) - sin(theta)*sin(phi)) * (0.1 * sin(nf * theta) + 1.0) +
    B * (a*cos(theta)*sin(phi) + sin(theta)*cos(phi)) * (0.1 * sin(nf * theta) + 1.0) +
    0.1 * nf * B * (a*sin(theta)*sin(phi)-cos(theta)*cos(phi))*cos(nf * theta) +
    0.1 * nf * N * (a*sin(theta)*cos(phi)+cos(theta)*sin(phi))*cos(nf * theta)
  );
  
  vec3 extra = exp(b*t) * vec3(d * (b*sin(t) + cos(t)), -d*(sin(t) - b*cos(t)), z*b);
  vec3 d_t = extra + (exp(b*t) - 1./(t+1.)) * R *
  (
    (0.1*sin(nf*theta) + 1.) * (a*sin(theta)*cos(phi) + cos(theta)*sin(phi)) * dN + 
    (0.1*sin(nf*theta) + 1.) * (a*sin(theta)*sin(phi) - cos(theta)*cos(phi)) * dB
  ) +
  (b*exp(b*t) + 1./(t+1.)/(t+1.)) * R *
  (
    (0.1*sin(nf*theta) + 1.) * (a*sin(theta)*cos(phi) + cos(theta)*sin(phi)) * N +
    (0.1*sin(nf*theta) + 1.) * (a*sin(theta)*sin(phi) - cos(theta)*cos(phi)) * B
  );

  vec3 normal = cross(d_t, d_theta);
  ans[3] = normal.x; ans[4] = normal.y; ans[5] = normal.z;

  return ans;
}

float[6] C(float t, float theta, mat3 R)
{
  float[6] ans;
  vec3 N = normalize(vec3(b*cos(t)-sin(t), -b*sin(t)-cos(t), 0.));
  vec3 B = normalize(vec3(b*z*(b*sin(t)+cos(t)), b*z*(b*cos(t) - sin(t)), d*(b*b+1.)));
  float nf = float(n);
  vec3 p = (exp(b*t) - 1./(t+1.)) * R * ((a*sin(theta)*cos(phi) + cos(theta)*sin(phi)) * (1. + 0.1 * sin(nf * theta)) * N + (a*sin(theta)*sin(phi)-cos(theta)*cos(phi)) * (1. + 0.1 * sin(nf * theta)) * B);
  ans[0] = p.x; ans[1] = p.y; ans[2] = p.z;

  
    float df1 = (a*cos(theta)*cos(phi) - sin(theta)*sin(phi)) * (1. + 0.1 * sin(nf * theta)) + 0.1 * nf * (a*sin(theta)*cos(phi) + cos(theta)*sin(phi))*cos(nf*theta);
    float df2 = (a*cos(theta)*sin(phi) + sin(theta)*cos(phi)) * (1. + 0.1 * sin(nf * theta)) + 0.1 * nf * (a*sin(theta)*cos(phi) - cos(theta)*cos(phi))*cos(nf*theta);

    // Proyect them
    vec3 tangent = df1 * N + df2 * B;

    // Obtain perpendicular
    vec3 T = normalize(vec3(d*(b*sin(t)+cos(t)), d*(b*cos(t)-sin(t)), -b*z));

    // Cross product
    vec3 normal = cross(T, tangent);
    ans[3] = normal.x; ans[4] = normal.y; ans[5] = normal.z;

  return ans;
}