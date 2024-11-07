const express = require("express");
const Payment = require("../models/Payments");
const router = express.Router();
const Cart = require("../models/Carts");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// token
const verifyToken = require("../middleware/verifyToken");

// post paymnet information to db
router.post("/", verifyToken, async (req, res) => {
  const payment = req.body;
  try {
    const paymnetRequest = await Payment.create(payment);

    // delete cart after payment
    const cartIds = payment.cartItems.map((id) => new ObjectId(id));
    const deletedCartRequest = await Cart.deleteMany({ _id: { $in: cartIds } });
    res.status(200).json({ paymnetRequest, deletedCartRequest });
  } catch (error) {
    res.status(404).json({ messga: error.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  try {
    const decodedEmail = req.decoded.email;
    if (email !== decodedEmail) {
      res.status(403).json({ message: "Forbidden Access" });
    }
    const result = await Payment.find(query).sort({ createdAt: -1 }).exec();
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ messga: error.message });
  }
});

// get all payments
router.get("/all", async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 }).exec();
    res.status(200).json(payments);
  } catch (error) {
    res.status(404).json({ messga: error.message });
  }
});

// confirm payment status
router.patch("/:id", async (req, res) => {
  const payId = req.params.id;
  const { status } = req.body;
  try {
    const updatedStatus = await Payment.findByIdAndUpdate(
      payId,
      { status: "confirmed" },
      { new: true, runValidators: true }
    );
    if (!updatedStatus) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(updatedStatus);
  } catch (error) {
    res.status(404).json({ messga: error.message });
  }
});

module.exports = router;
