import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";
import {
  cancelBookingService,
  confirmBookingService,
  createBookingService,
  rejectBookingService,
  updateBookingService,
  getGuestBookingsService,
  getHostBookingsService,
} from "./bookings.service";

const extractUserId = (req: Request) => {
  if (!req.user?.id) throw new ApiError(401, "User ID is required");
  return req.user.id;
};

const extractBookingId = (req: Request) => {
  const id = req.params.id;
  if (!id || typeof id !== "string") throw new ApiError(400, "Booking ID is required");
  return id;
};

export const createBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guestId = extractUserId(req);
    const { unitId, checkIn, checkOut } = req.body;

    if (!unitId || !checkIn || !checkOut) {
      throw new ApiError(400, "unitId, checkIn, and checkOut are required");
    }

    const booking = await createBookingService(
      guestId,
      unitId,
      new Date(checkIn),
      new Date(checkOut),
    );

    res.status(201).json({
      status: 201,
      message: "booking created successfully",
      data: booking,
    });
  },
);

export const updateBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guestId = extractUserId(req);
    const bookingId = extractBookingId(req);
    const { checkIn, checkOut } = req.body;

    if (!checkIn || !checkOut) {
      throw new ApiError(400, "checkIn and checkOut are required");
    }

    const booking = await updateBookingService(bookingId, guestId, [
      new Date(checkIn),
      new Date(checkOut),
    ]);

    res.status(200).json({
      status: 200,
      message: "booking updated successfully",
      data: booking,
    });
  },
);

export const cancelBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guestId = extractUserId(req);
    const bookingId = extractBookingId(req);

    const booking = await cancelBookingService(bookingId, guestId);

    res.status(200).json({
      status: 200,
      message: "booking canceled successfully",
      data: booking,
    });
  },
);

export const confirmBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const hostId = extractUserId(req);
    const bookingId = extractBookingId(req);

    const booking = await confirmBookingService(bookingId, hostId);

    res.status(200).json({
      status: 200,
      message: "booking confirmed successfully",
      data: booking,
    });
  },
);

export const rejectBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const hostId = extractUserId(req);
    const bookingId = extractBookingId(req);

    const booking = await rejectBookingService(bookingId, hostId);

    res.status(200).json({
      status: 200,
      message: "booking rejected successfully",
      data: booking,
    });
  },
);

export const getGuestBookings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guestId = extractUserId(req);
    const bookings = await getGuestBookingsService(guestId);

    res.status(200).json({
      status: 200,
      message: "guest bookings retrieved successfully",
      data: bookings,
    });
  },
);

export const getHostBookings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const hostId = extractUserId(req);
    const bookings = await getHostBookingsService(hostId);

    res.status(200).json({
      status: 200,
      message: "host bookings retrieved successfully",
      data: bookings,
    });
  },
);
