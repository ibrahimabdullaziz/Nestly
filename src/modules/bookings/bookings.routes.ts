import express from "express";
import { authGuard } from "../../common/middleware/authGuard";
import { roleGuard } from "../../common/middleware/roleGuard";
import {
  cancelBooking,
  confirmBooking,
  createBooking,
  rejectBooking,
  updateBooking,
  getGuestBookings,
  getHostBookings,
} from "./bookings.controller";

const router = express.Router;

const bookingRoutes = router();

//POST /api/bookings
bookingRoutes.post("/", authGuard, roleGuard("GUEST"), createBooking);

//PATCH /api/bookings/:id
bookingRoutes.patch("/:id", authGuard, roleGuard("GUEST"), updateBooking);

//DELETE /api/bookings/:id
bookingRoutes.delete("/:id", authGuard, roleGuard("GUEST"), cancelBooking);

// PATCH /api/bookings/:id/confirm
bookingRoutes.patch("/:id/confirm", authGuard, roleGuard("HOST"), confirmBooking);

// PATCH /api/bookings/:id/reject
bookingRoutes.patch("/:id/reject", authGuard, roleGuard("HOST"), rejectBooking);

//GET /api/bookings/mine
bookingRoutes.get("/mine", authGuard, roleGuard("GUEST"), getGuestBookings);

//GET /api/bookings/host
bookingRoutes.get("/host", authGuard, roleGuard("HOST"), getHostBookings);

export default bookingRoutes;
