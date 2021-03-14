const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  Tag.findAll({
    include: [
      {
        model: Product,
        attributes: ['product_name'],
        through: ProductTag,
        as: 'tags_on_product'
      }
    ]
  })
    .then(dbTags => res.json(dbTags))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/:id', (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  Tag.findOne({
    where: {
      id: req.params.id
    },
    include: [
      {
        model: Product,
        attributes: ['product_name'],
        through: ProductTag,
        as: 'tags_on_product'
      }
    ]
  })
    .then(dbTags => res.json(dbTags))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.post('/', (req, res) => {
  // create a new tag
  Tag.create(req.body)
    .then(tags => {
      if (req.body.productIds.length) {
        const productTagIdArr = req.body.productIds.map(product_id => {
          return {
            tag_id: tags.id,
            product_id
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      res.status(200).json(tag)
    })
    .then(tagIds => res.json(tagIds))
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(req.body, {
    where: {
      id: req.params.id
    }
  })
    .then(tag => {
      return ProductTag.findAll({
        where: {
          tag_id: req.params.id
        }
      })
    })
    .then(taggedProducts => {
      const taggedProductIds = taggedProducts.map(({ product_id }) => product_id);
      // create filtered list of new tag_ids
      const newTaggedProducts = req.body.productIds
        .filter((product_id) => !taggedProductIds.includes(product_id))
        .map((product_id) => {
          return {
            tag_id: req.params.id,
            product_id,
          };
        });
      const taggedProductToRemove = taggedProducts
        .filter(({ product_id }) => !req.body.productIds.includes(product_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: taggedProductToRemove } }),
        ProductTag.bulkCreate(newTaggedProducts),
      ]);
    })
    .then((updatedTags) => res.json(updatedTags))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete on tag by its `id` value
  Tag.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(dbTags => res.json(dbTags))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
