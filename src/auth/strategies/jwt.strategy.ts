import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      storeId: payload.storeId,
      role: payload.role,
    };
  }
}
