export interface AuthUser {
  id: string;
  email: string;
  vaiTro: 'HOC_SINH' | 'GIAO_VIEN' | 'QUAN_TRI_VIEN' | string;
}
