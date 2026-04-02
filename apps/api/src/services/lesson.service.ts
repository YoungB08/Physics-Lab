import { prisma } from '../config/prisma.js';
export const getCurriculum = () => prisma.chuong.findMany({ include: { baiHoc: { include: { phanKienThuc: true, moPhong: true } } }, orderBy: [{ lop: 'asc' }, { thuTu: 'asc' }] });
export const getLessonBySlug = (slug: string) => prisma.baiHoc.findUnique({ where: { slug }, include: { chuong: true, phanKienThuc: { orderBy: { thuTu: 'asc' } }, moPhong: true, cauHoi: true } });
