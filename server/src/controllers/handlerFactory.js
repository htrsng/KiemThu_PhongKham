exports.getAll = (Model) => async (req, res, next) => {
  try {
    const filter = { ...req.query };
    const excludeFields = ['limit', 'skip', 'sort'];
    excludeFields.forEach((el) => delete filter[el]);

    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = parseInt(req.query.skip, 10) || 0;
    const rawSort = req.query.sort ? String(req.query.sort) : '-updatedAt';

    const cursor = Model.find(filter).sort(rawSort).skip(skip).limit(limit);
    const documents = await cursor;
    const total = await Model.countDocuments(filter);

    res.json({ data: documents.map(doc => doc.toJSON()), total });
  } catch (error) {
    next(error);
  }
};

exports.getOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ data: doc.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.createOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.create(req.body);
    res.status(201).json({ data: doc.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ data: doc.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ deletedCount: 1 });
  } catch (error) {
    next(error);
  }
};
