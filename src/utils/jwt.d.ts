export interface TokenPayload {
  uuid: string;
  role: string;
}
/**
 *
 * @param payload
 * @returns
 */
export declare const generateAccessToken: (payload: TokenPayload) => never;
/**
 *
 * @param payload
 * @returns
 */
export declare const generateRefreshToken: (payload: TokenPayload) => never;
/**
 *
 * @param token
 * @returns
 */
export declare const verifyAccessToken: (token: string) => TokenPayload | null;
/**
 *
 * @param token
 * @returns
 */
export declare const verifyRefreshToken: (token: string) => TokenPayload | null;
//# sourceMappingURL=jwt.d.ts.map
